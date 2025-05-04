from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional

# Конфигурация JWT
SECRET_KEY = "socialqr_secret_key_replace_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Модели данных
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    is_admin: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

# Временное хранилище пользователей (в реальном приложении это должна быть база данных)
fake_users_db = {
    "admin": {
        "username": "admin",
        "full_name": "Admin User",
        "email": "admin@example.com",
        "hashed_password": "admin",  # В реальном приложении должен быть хешированный пароль
        "disabled": False,
        "is_admin": True,
    }
}

app = FastAPI(title="SocialQR API")

# Улучшенная настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Кэшируем предварительные проверки на 1 час
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Функции для работы с JWT
def verify_password(plain_password, hashed_password):
    # В реальном приложении здесь должна быть проверка хеша
    return plain_password == hashed_password

def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)
    return None

def authenticate_user(fake_db, username: str, password: str):
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Недействительные учетные данные",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Неактивный пользователь")
    return current_user

# Добавляем новый класс для JSON-логина
class UserLogin(BaseModel):
    username: str
    password: str

# Модифицируем существующий эндпоинт token и добавляем новый для JSON
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Добавляем дополнительный эндпоинт для JSON-авторизации
@app.post("/login")
async def login_json(user_data: UserLogin):
    user = authenticate_user(fake_users_db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверное имя пользователя или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Возвращаем больше информации для фронтенда
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin,
        },
        "has_admin_panel": user.is_admin,
        "menu_items": [
            {"name": "profile", "title": "Мой профиль", "url": "/profile", "icon": "user"},
            {"name": "qrcodes", "title": "Мои QR-коды", "url": "/my-qrcodes", "icon": "qrcode"},
        ] + ([{"name": "admin", "title": "Админ панель", "url": "/admin", "icon": "shield"}] if user.is_admin else [])
    }

# Добавим эндпоинт для проверки состояния аутентификации
@app.get("/check-auth")
async def check_auth():
    return {"status": "ok", "authenticated": False, "message": "Для получения доступа необходима авторизация"}

# Защищенный эндпоинт для проверки после авторизации
@app.get("/check-auth-protected")
async def check_auth_protected(current_user: User = Depends(get_current_active_user)):
    return {"status": "ok", "authenticated": True, "username": current_user.username}

@app.get("/")
def root():
    return {"message": "SocialQR API работает!"}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.get("/users/me/items")
async def read_own_items(current_user: User = Depends(get_current_active_user)):
    return [{"item_id": "1", "owner": current_user.username}]

# Добавляем админ-панель и эндпоинты для неё

# Модель для тестовых данных QR-кодов
class QRCode(BaseModel):
    id: str
    owner: str
    url: str
    title: str
    created_at: str
    visits: int

# Временное хранилище QR-кодов
fake_qr_codes = [
    {
        "id": "qr1",
        "owner": "admin",
        "url": "https://example.com/1",
        "title": "Тестовый QR код 1",
        "created_at": "2023-11-01",
        "visits": 10
    },
    {
        "id": "qr2",
        "owner": "admin",
        "url": "https://example.com/2",
        "title": "Тестовый QR код 2",
        "created_at": "2023-11-05",
        "visits": 5
    }
]

# Административные эндпоинты
@app.get("/admin/qrcodes", response_model=list[QRCode])
async def get_all_qrcodes(current_user: User = Depends(get_current_active_user)):
    if current_user.username != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен. Только администратор может просматривать все QR-коды"
        )
    return fake_qr_codes

@app.get("/admin/users")
async def get_all_users(current_user: User = Depends(get_current_active_user)):
    if current_user.username != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен. Только администратор может просматривать всех пользователей"
        )
    users = []
    for username, user_data in fake_users_db.items():
        user_copy = user_data.copy()
        user_copy.pop("hashed_password", None)
        users.append(user_copy)
    return users

@app.get("/admin/dashboard")
async def admin_dashboard(current_user: User = Depends(get_current_active_user)):
    if current_user.username != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен. Только администратор может просматривать эту страницу"
        )
    return {
        "status": "ok", 
        "message": "Добро пожаловать в административную панель",
        "stats": {
            "total_users": len(fake_users_db),
            "total_qrcodes": len(fake_qr_codes),
            "total_visits": sum(qr.get("visits", 0) for qr in fake_qr_codes)
        }
    }

# Улучшенный эндпоинт для профиля пользователя
@app.get("/users/me/profile", response_model=dict)
async def get_user_profile(current_user: User = Depends(get_current_active_user)):
    is_admin = current_user.username == "admin"
    
    return {
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "is_admin": is_admin,
        "menu_items": [
            {"title": "Мой профиль", "url": "/profile", "icon": "user"},
            {"title": "Мои QR-коды", "url": "/my-qrcodes", "icon": "qrcode"}
        ] + ([{"title": "Админ панель", "url": "/admin", "icon": "shield"}] if is_admin else [])
    }

# Эндпоинт для проверки прав администратора
@app.get("/auth/check-admin")
async def check_admin_rights(current_user: User = Depends(get_current_active_user)):
    is_admin = current_user.username == "admin"
    return {
        "is_admin": is_admin,
        "message": "У вас есть права администратора" if is_admin else "У вас нет прав администратора"
    }

# Улучшенный эндпоинт для получения состояния авторизации и роли пользователя
@app.get("/auth/status")
async def auth_status(current_user: User = Depends(get_current_active_user)):
    """Возвращает информацию о текущем пользователе и его правах доступа"""
    return {
        "authenticated": True,
        "user": {
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "is_admin": current_user.is_admin or False,
        },
        "permissions": {
            "can_view_admin": current_user.is_admin or False,
            "can_edit_users": current_user.is_admin or False,
            "can_edit_qrcodes": True,  # Все могут редактировать свои QR-коды
        },
        "menu": {
            "items": [
                {"id": "profile", "title": "Мой профиль", "url": "/profile", "icon": "user", "order": 1},
                {"id": "qrcodes", "title": "Мои QR-коды", "url": "/my-qrcodes", "icon": "qrcode", "order": 2},
            ] + ([{"id": "admin", "title": "Админ панель", "url": "/admin", "icon": "shield", "order": 3}] if (current_user.is_admin or False) else [])
        }
    }

# Более подробный эндпоинт для панели администратора
@app.get("/admin/config")
async def admin_config(current_user: User = Depends(get_current_active_user)):
    """Возвращает конфигурацию админ-панели"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен. Требуются права администратора"
        )
    
    return {
        "title": "Панель администратора SocialQR",
        "user": {
            "username": current_user.username,
            "is_admin": True
        },
        "sections": [
            {
                "id": "dashboard",
                "title": "Информационная панель",
                "url": "/admin/dashboard",
                "icon": "dashboard"
            },
            {
                "id": "users",
                "title": "Пользователи",
                "url": "/admin/users",
                "icon": "users"
            },
            {
                "id": "qrcodes",
                "title": "QR-коды",
                "url": "/admin/qrcodes",
                "icon": "qrcode"
            },
            {
                "id": "settings",
                "title": "Настройки",
                "url": "/admin/settings",
                "icon": "settings"
            }
        ]
    }

# Обеспечиваем неограниченный доступ к эндпоинтам для проверки админ-статуса
# Это поможет фронтенду стабильно проверять права без мерцания
@app.options("/auth/check-admin")
@app.get("/auth/check-admin")
def check_admin_status(token: str = Header(None)):
    if not token:
        return {"is_admin": False, "authenticated": False}
    
    try:
        payload = jwt.decode(token.replace("Bearer ", ""), SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username or username not in fake_users_db:
            return {"is_admin": False, "authenticated": True}
        
        return {
            "is_admin": fake_users_db[username].get("is_admin", False),
            "authenticated": True,
            "username": username
        }
    except:
        return {"is_admin": False, "authenticated": False}