from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
import jwt
from pydantic import BaseModel
import models
import schemas
from database import engine, SessionLocal

# Создаем таблицы
models.Base.metadata.create_all(bind=engine)

# Создаем тестового администратора, если его нет
def create_test_admin():
    db = SessionLocal()
    try:
        admin = db.query(models.User).filter(models.User.username == "admin").first()
        if not admin:
            admin = models.User(
                username="admin",
                name="Администратор",
                is_admin=True
            )
            admin.set_password("admin123")
            db.add(admin)
            
            # Создаем тестового пользователя
            test_user = models.User(
                username="test",
                name="Тестовый пользователь",
                is_admin=False
            )
            test_user.set_password("test123")
            db.add(test_user)
            
            # Создаем подписку для тестового пользователя
            test_subscription = models.Subscription(
                user_id=2,  # ID будет 2, т.к. сначала создается админ с ID 1
                activation_date=datetime.utcnow(),
                expiration_date=datetime.utcnow() + timedelta(days=365),
                is_active=True
            )
            db.add(test_subscription)
            
            db.commit()
    except Exception as e:
        print(f"Ошибка при создании тестового аккаунта: {e}")
    finally:
        db.close()

create_test_admin()

app = FastAPI(title="SocialQR API")

# Добавляем CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшне заменить на конкретные домены
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Секретный ключ для JWT
SECRET_KEY = "YOUR_SECRET_KEY"  # В продакшне использовать секретный ключ из окружения
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 день

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Dependency для получения DB сессии
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Создание JWT токена
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Получение текущего пользователя
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

# Проверка, является ли пользователь админом
def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not enough permissions"
        )
    return current_user

# Аутентификация и получение токена
@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not user.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Проверка активации подписки
    if not user.subscription or not user.subscription.is_active:
        # Если подписка не активирована, активируем её на 1 год
        if not user.subscription:
            new_subscription = models.Subscription(
                user_id=user.id,
                activation_date=datetime.utcnow(),
                expiration_date=datetime.utcnow() + timedelta(days=365),
                is_active=True
            )
            db.add(new_subscription)
        else:
            user.subscription.activation_date = datetime.utcnow()
            user.subscription.expiration_date = datetime.utcnow() + timedelta(days=365)
            user.subscription.is_active = True
        
        db.commit()
    
    access_token = create_access_token(
        data={"sub": user.username}
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Эндпоинты для пользователей
@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users/subscription")
def check_subscription(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    subscription = db.query(models.Subscription).filter(models.Subscription.user_id == current_user.id).first()
    if not subscription:
        return {"is_active": False, "expiration_date": None}
    return {"is_active": subscription.is_active, "expiration_date": subscription.expiration_date}

# Эндпоинты для админов
@app.get("/admin/users", response_model=List[schemas.UserAdmin])
def get_all_users(admin_user: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    try:
        print(f"Запрос списка пользователей от админа: {admin_user.username}")
    users = db.query(models.User).filter(models.User.is_admin == False).all()
        print(f"Найдено пользователей: {len(users)}")
        
        # Преобразуем объекты Subscription в словари
        result = []
        for user in users:
            user_dict = {
                "id": user.id,
                "username": user.username,
                "name": user.name,
                "is_admin": user.is_admin,
                "created_at": user.created_at,
                "subscription": None
            }
            
            if user.subscription:
                user_dict["subscription"] = {
                    "id": user.subscription.id,
                    "user_id": user.subscription.user_id,
                    "activation_date": user.subscription.activation_date,
                    "expiration_date": user.subscription.expiration_date,
                    "is_active": user.subscription.is_active
                }
            
            result.append(user_dict)
        
        return result
    except Exception as e:
        print(f"Ошибка при получении списка пользователей: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при получении списка пользователей: {str(e)}"
        )

@app.post("/admin/users", response_model=schemas.UserAdmin)
def create_user(user: schemas.UserCreate, admin_user: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    try:
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = models.User(
        username=user.username,
        name=user.name,
        is_admin=False
    )
    new_user.set_password(user.password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
        
        # Преобразуем объект в словарь для ответа
        user_dict = {
            "id": new_user.id,
            "username": new_user.username,
            "name": new_user.name,
            "is_admin": new_user.is_admin,
            "created_at": new_user.created_at,
            "subscription": None
        }
        
        return user_dict
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при создании пользователя: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при создании пользователя: {str(e)}"
        )

@app.put("/admin/users/{user_id}", response_model=schemas.UserAdmin)
def update_user(user_id: int, user: schemas.UserUpdate, admin_user: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    try:
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.name:
        db_user.name = user.name
    if user.username:
        db_user.username = user.username
    if user.password:
        db_user.set_password(user.password)
    
    db.commit()
    db.refresh(db_user)
        
        # Преобразуем объект в словарь для ответа
        user_dict = {
            "id": db_user.id,
            "username": db_user.username,
            "name": db_user.name,
            "is_admin": db_user.is_admin,
            "created_at": db_user.created_at,
            "subscription": None
        }
        
        if db_user.subscription:
            user_dict["subscription"] = {
                "id": db_user.subscription.id,
                "user_id": db_user.subscription.user_id,
                "activation_date": db_user.subscription.activation_date,
                "expiration_date": db_user.subscription.expiration_date,
                "is_active": db_user.subscription.is_active
            }
        
        return user_dict
    except HTTPException:
        raise
    except Exception as e:
        print(f"Ошибка при обновлении пользователя: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка при обновлении пользователя: {str(e)}"
        )

@app.delete("/admin/users/{user_id}")
def delete_user(user_id: int, admin_user: models.User = Depends(get_admin_user), db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return {"detail": "User deleted successfully"}

# Эндпоинты для виджетов
@app.post("/widgets", response_model=schemas.Widget)
def create_widget(widget: schemas.WidgetCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_widget = models.Widget(
        type=widget.type,
        content=widget.content,
        position_x=widget.position_x,
        position_y=widget.position_y,
        width=widget.width,
        height=widget.height,
        user_id=current_user.id,
        anchor=widget.anchor
    )
    db.add(new_widget)
    db.commit()
    db.refresh(new_widget)
    return new_widget

@app.get("/widgets", response_model=List[schemas.Widget])
def get_user_widgets(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    widgets = db.query(models.Widget).filter(models.Widget.user_id == current_user.id).all()
    return widgets

@app.put("/widgets/{widget_id}", response_model=schemas.Widget)
def update_widget(widget_id: int, widget: schemas.WidgetUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_widget = db.query(models.Widget).filter(models.Widget.id == widget_id, models.Widget.user_id == current_user.id).first()
    if not db_widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    for key, value in widget.dict(exclude_unset=True).items():
        setattr(db_widget, key, value)
    
    db.commit()
    db.refresh(db_widget)
    return db_widget

@app.delete("/widgets/{widget_id}")
def delete_widget(widget_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_widget = db.query(models.Widget).filter(models.Widget.id == widget_id, models.Widget.user_id == current_user.id).first()
    if not db_widget:
        raise HTTPException(status_code=404, detail="Widget not found")
    
    db.delete(db_widget)
    db.commit()
    return {"detail": "Widget deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 