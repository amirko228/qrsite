from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.gzip import GZipMiddleware

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

# Модель для изменения пароля
class PasswordChange(BaseModel):
    username: str
    new_password: str
    current_password: Optional[str] = None  # Для админа может быть необязательным

# Добавляем стабильные эндпоинты для админ-панели без мерцания
@app.get("/api/admin/navigation")
def admin_navigation(token: str = Header(None)):
    """Возвращает структуру навигации для админ-панели"""
    if not token:
        return {"success": False, "error": "Требуется авторизация"}
    
    try:
        payload = jwt.decode(token.replace("Bearer ", ""), SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username or username not in fake_users_db:
            return {"success": False, "error": "Пользователь не найден"}
        
        user_data = fake_users_db[username]
        if not user_data.get("is_admin", False):
            return {"success": False, "error": "Отказано в доступе"}
        
        # Возвращаем фиксированную структуру навигации для стабильности
        return {
            "success": True,
            "data": {
                "main_menu": [
                    {"id": "dashboard", "title": "Главная", "icon": "home", "url": "/admin"},
                    {"id": "users", "title": "Пользователи", "icon": "users", "url": "/admin/users"},
                    {"id": "qrcodes", "title": "QR-коды", "icon": "qrcode", "url": "/admin/qrcodes"},
                    {"id": "settings", "title": "Настройки", "icon": "settings", "url": "/admin/settings"}
                ],
                "user_menu": [
                    {"id": "profile", "title": "Мой профиль", "icon": "user", "url": "/profile"},
                    {"id": "logout", "title": "Выход", "icon": "logout", "url": "/logout"}
                ]
            }
        }
    except:
        return {"success": False, "error": "Недействительный токен"}

# Эндпоинт для получения данных профиля пользователя
@app.get("/api/user/profile")
def user_profile(token: str = Header(None)):
    """Возвращает информацию о профиле пользователя"""
    if not token:
        return {"success": False, "error": "Требуется авторизация"}
    
    try:
        payload = jwt.decode(token.replace("Bearer ", ""), SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username or username not in fake_users_db:
            return {"success": False, "error": "Пользователь не найден"}
        
        user_data = fake_users_db[username]
        # Копируем данные, чтобы не возвращать пароль
        profile_data = {k: v for k, v in user_data.items() if k != "hashed_password"}
        
        return {
            "success": True,
            "data": profile_data,
            "menu": [
                {"id": "profile", "title": "Мой профиль", "icon": "user", "url": "/profile"},
                {"id": "qrcodes", "title": "Мои QR-коды", "icon": "qrcode", "url": "/my-qrcodes"}
            ] + ([{"id": "admin", "title": "Админ панель", "icon": "shield", "url": "/admin"}] if user_data.get("is_admin", False) else [])
        }
    except:
        return {"success": False, "error": "Недействительный токен"}

# Эндпоинт для изменения пароля (только для админа)
@app.post("/admin/change-password")
async def admin_change_password(
    password_data: PasswordChange, 
    current_user: User = Depends(get_current_active_user)
):
    """Позволяет администратору изменить пароль пользователя"""
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен. Только администратор может менять пароли."
        )
    
    # Проверяем, существует ли пользователь
    if password_data.username not in fake_users_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Пользователь {password_data.username} не найден"
        )
    
    # Меняем пароль
    fake_users_db[password_data.username]["hashed_password"] = password_data.new_password
    
    return {
        "success": True, 
        "message": f"Пароль пользователя {password_data.username} успешно изменен"
    }

# Эндпоинт для самостоятельного изменения пароля пользователем
@app.post("/user/change-password")
async def user_change_password(
    password_data: PasswordChange, 
    current_user: User = Depends(get_current_active_user)
):
    """Позволяет пользователю изменить свой пароль"""
    # Проверяем, что пользователь меняет свой пароль
    if current_user.username != password_data.username:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Вы можете изменить только свой собственный пароль"
        )
    
    # Проверяем текущий пароль
    if not verify_password(password_data.current_password, fake_users_db[current_user.username]["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неверный текущий пароль"
        )
    
    # Меняем пароль
    fake_users_db[current_user.username]["hashed_password"] = password_data.new_password
    
    return {
        "success": True, 
        "message": "Ваш пароль успешно изменен"
    }

# Добавляем предварительные маршруты для всех основных эндпоинтов
# Это помогает избежать мерцания при навигации
@app.options("/api/admin/{path:path}")
@app.options("/api/user/{path:path}")
@app.options("/admin/{path:path}")
@app.options("/users/{path:path}")
def options_handler():
    return {"status": "ok"}

# Добавляем сжатие ответов для ускорения работы
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Добавим публичные версии эндпоинтов для стабильной работы
@app.get("/api/public/menu")
def public_menu():
    """Возвращает общее меню для неавторизованных пользователей"""
    return {
        "success": True,
        "data": {
            "main_menu": [
                {"id": "login", "title": "Вход", "icon": "login", "url": "/login"},
                {"id": "about", "title": "О сервисе", "icon": "info", "url": "/about"}
            ]
        }
    }

# Обработчик ошибок аутентификации без возврата 401, чтобы избежать мерцания
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    if exc.status_code == 401:
        return JSONResponse(
            status_code=200,  # Возвращаем 200 вместо 401 для стабильности фронтенда
            content={
                "success": False,
                "error": exc.detail,
                "redirect_to": "/login"
            }
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )