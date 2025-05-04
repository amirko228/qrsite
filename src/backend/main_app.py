from fastapi import FastAPI, Depends, HTTPException, status, Header, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.middleware.gzip import GZipMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional, List, Dict, Any, Union

# Конфигурация JWT
SECRET_KEY = "socialqr_secret_key_replace_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # Увеличиваем срок жизни токена до недели

# Модели данных
class Token(BaseModel):
    access_token: str
    token_type: str
    user_data: Dict[str, Any]

class TokenData(BaseModel):
    username: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class PasswordChange(BaseModel):
    username: str
    new_password: str
    current_password: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None
    is_admin: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

# Модель для QR-кодов
class QRCode(BaseModel):
    id: str
    owner: str
    url: str
    title: str
    created_at: str
    visits: int

# Временное хранилище пользователей
fake_users_db = {
    "admin": {
        "username": "admin",
        "full_name": "Admin User",
        "email": "admin@example.com",
        "hashed_password": "admin",
        "disabled": False,
        "is_admin": True,
    }
}

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

app = FastAPI(title="SocialQR API")

# Отключаем стандартный обработчик ошибок, который может вызывать мерцание
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=200,  # Всегда возвращаем 200 для предотвращения мерцания
        content={
            "success": False,
            "error": exc.detail,
            "code": exc.status_code
        }
    )

# CORS настройки с поддержкой всех заголовков для предотвращения проблем в браузере
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400,  # Кэшировать CORS предзапросы на сутки
)

# Добавляем сжатие ответов
app.add_middleware(GZipMiddleware, minimum_size=500)

# OAuth2 с поддержкой Bearer токенов
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token", auto_error=False)

# Функции для JWT
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
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Базовые функции авторизации
async def get_current_user_optional(token: str = Depends(oauth2_scheme)):
    if token is None:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = TokenData(username=username)
    except JWTError:
        return None
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        return None
    return user

async def get_current_user(token: str = Depends(oauth2_scheme)):
    user = await get_current_user_optional(token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Требуется авторизация",
        )
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Неактивный пользователь")
    return current_user

async def get_admin_user(current_user: User = Depends(get_current_active_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ запрещен. Только администратор может просматривать эту страницу"
        )
    return current_user

# Функция получения данных пользователя с токеном
def get_user_data_with_token(user: User, token: str):
    user_dict = user.dict()
    user_dict.pop("disabled", None)
    
    # Информация для навигации в зависимости от прав
    is_admin = user.is_admin or False
    
    return {
        "user": user_dict,
        "permissions": {
            "is_admin": is_admin,
            "can_edit_users": is_admin,
            "can_edit_qrcodes": True,
        },
        "menu": [
            {"id": "profile", "title": "Мой профиль", "url": "/profile", "icon": "user"},
            {"id": "qrcodes", "title": "Мои QR-коды", "url": "/my-qrcodes", "icon": "qrcode"}
        ] + ([{"id": "admin", "title": "Админ панель", "url": "/admin", "icon": "shield"}] if is_admin else []),
        "token": token
    }

# ---------- ЭНДПОИНТЫ АУТЕНТИФИКАЦИИ ---------- #

@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        return JSONResponse(
            status_code=200,
            content={"success": False, "error": "Неверное имя пользователя или пароль"}
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Подготавливаем данные пользователя для ответа
    user_data = get_user_data_with_token(user, access_token)
    
    return {
        "success": True,
        "access_token": access_token, 
        "token_type": "bearer",
        "user_data": user_data
    }

@app.post("/login")
async def login_json(user_data: UserLogin):
    user = authenticate_user(fake_users_db, user_data.username, user_data.password)
    if not user:
        return JSONResponse(
            status_code=200,
            content={"success": False, "error": "Неверное имя пользователя или пароль"}
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Подготавливаем данные пользователя для ответа
    response_data = get_user_data_with_token(user, access_token)
    
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user_data": response_data
    }

# Эндпоинт для стандартной формы входа
@app.post("/login", include_in_schema=True)
async def standard_login_form(request: Request):
    try:
        form_data = await request.form()
        username = form_data.get("username", "")
        password = form_data.get("password", "")
        
        user = authenticate_user(fake_users_db, username, password)
        if not user:
            return JSONResponse(
                status_code=200,
                content={"success": False, "error": "Неверное имя пользователя или пароль"}
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        # Подготавливаем данные пользователя
        user_data = get_user_data_with_token(user, access_token)
        
        response = JSONResponse(
            content={
                "success": True,
                "access_token": access_token,
                "token_type": "bearer",
                "user_data": user_data
            }
        )
        
        # Устанавливаем cookie для сессии
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax",
            path="/"
        )
        
        return response
    except Exception as e:
        return JSONResponse(
            status_code=200,
            content={"success": False, "error": str(e)}
        )

# Обработка авторизации через основной URL
@app.post("/")
async def root_login(request: Request):
    # Перенаправляем на стандартный обработчик
    return await standard_login_form(request)

# ---------- ПУБЛИЧНЫЕ ЭНДПОИНТЫ ---------- #

@app.get("/")
def root():
    return {"message": "SocialQR API работает!"}

@app.get("/api/public/status")
def api_status():
    return {
        "status": "online",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

# ---------- ЭНДПОИНТЫ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ ---------- #

@app.get("/api/user/profile")
async def get_profile(current_user: User = Depends(get_current_active_user)):
    user_dict = current_user.dict()
    user_dict.pop("disabled", None)
    
    return {
        "success": True,
        "data": user_dict
    }

@app.post("/api/user/change-password")
async def change_password(
    password_data: PasswordChange, 
    current_user: User = Depends(get_current_active_user)
):
    # Проверяем, что пользователь меняет свой пароль
    if current_user.username != password_data.username and not current_user.is_admin:
        return {
            "success": False,
            "error": "Вы можете изменить только свой собственный пароль"
        }
    
    # Если не админ, проверяем текущий пароль
    if not current_user.is_admin:
        if not verify_password(password_data.current_password, fake_users_db[current_user.username]["hashed_password"]):
            return {
                "success": False,
                "error": "Неверный текущий пароль"
            }
    
    # Если меняет свой пароль или админ меняет чужой
    target_user = password_data.username
    if target_user in fake_users_db:
        fake_users_db[target_user]["hashed_password"] = password_data.new_password
        return {
            "success": True, 
            "message": "Пароль успешно изменен"
        }
    else:
        return {
            "success": False,
            "error": "Пользователь не найден"
        }

# ---------- ЭНДПОИНТЫ АДМИН-ПАНЕЛИ ---------- #

@app.get("/api/admin/check")
async def admin_check(admin_user: User = Depends(get_admin_user)):
    return {
        "success": True,
        "message": "У вас есть права администратора"
    }

@app.get("/api/admin/users", response_model=Dict[str, Any])
async def admin_users(admin_user: User = Depends(get_admin_user)):
    users = []
    for username, user_data in fake_users_db.items():
        user_copy = {k: v for k, v in user_data.items() if k != "hashed_password"}
        users.append(user_copy)
    
    return {
        "success": True,
        "data": users
    }

@app.get("/api/admin/qrcodes", response_model=Dict[str, Any])
async def admin_qrcodes(admin_user: User = Depends(get_admin_user)):
    return {
        "success": True,
        "data": fake_qr_codes
    }

@app.get("/api/admin/dashboard", response_model=Dict[str, Any])
async def admin_dashboard(admin_user: User = Depends(get_admin_user)):
    return {
        "success": True, 
        "data": {
            "stats": {
                "total_users": len(fake_users_db),
                "total_qrcodes": len(fake_qr_codes),
                "total_visits": sum(qr.get("visits", 0) for qr in fake_qr_codes)
            }
        }
    }

@app.post("/api/admin/change-password")
async def admin_change_password(
    password_data: PasswordChange, 
    admin_user: User = Depends(get_admin_user)
):
    if password_data.username not in fake_users_db:
        return {
            "success": False,
            "error": f"Пользователь {password_data.username} не найден"
        }
    
    fake_users_db[password_data.username]["hashed_password"] = password_data.new_password
    
    return {
        "success": True, 
        "message": f"Пароль пользователя {password_data.username} успешно изменен"
    }

# ---------- ОБРАБОТЧИКИ ПРЕДЗАПРОСОВ (OPTIONS) ---------- #

@app.options("/{full_path:path}")
async def options_route(full_path: str):
    return {"success": True}

# Добавляем обработчик ошибок метода
@app.exception_handler(405)
async def method_not_allowed_handler(request, exc):
    return JSONResponse(
        status_code=200,
        content={"success": False, "error": "Метод не разрешен. Пожалуйста, используйте правильный HTTP метод."}
    )

# Добавляем поддержку для дополнительных методов авторизации
@app.post("/auth/login")
async def form_login(username: str = Form(...), password: str = Form(...)):
    user = authenticate_user(fake_users_db, username, password)
    if not user:
        return JSONResponse(
            status_code=200,
            content={"success": False, "error": "Неверное имя пользователя или пароль"}
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Подготавливаем данные пользователя для ответа
    user_data = get_user_data_with_token(user, access_token)
    
    return {
        "success": True,
        "access_token": access_token, 
        "token_type": "bearer",
        "user_data": user_data
    }

# Обновляем эндпоинт JSON логина для поддержки всех возможных форматов данных
@app.post("/api/login")
@app.post("/api/auth/login")
async def api_login(request: Request):
    try:
        # Пробуем получить данные разными способами
        content_type = request.headers.get("Content-Type", "")
        
        # Для JSON данных
        if "application/json" in content_type:
            json_data = await request.json()
            username = json_data.get("username", "")
            password = json_data.get("password", "")
        # Для данных формы
        else:
            form_data = await request.form()
            username = form_data.get("username", "")
            password = form_data.get("password", "")
        
        user = authenticate_user(fake_users_db, username, password)
        if not user:
            return JSONResponse(
                status_code=200,
                content={"success": False, "error": "Неверное имя пользователя или пароль"}
            )
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        
        # Подготавливаем данные пользователя
        user_data = get_user_data_with_token(user, access_token)
        
        response = JSONResponse(
            content={
                "success": True,
                "access_token": access_token,
                "token_type": "bearer",
                "user_data": user_data
            }
        )
        
        # Устанавливаем cookie для сессии
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            samesite="lax",
            path="/"
        )
        
        return response
    except Exception as e:
        return JSONResponse(
            status_code=200,
            content={"success": False, "error": str(e)}
        )