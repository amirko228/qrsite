from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

# Схемы для Widget
class WidgetBase(BaseModel):
    type: str
    content: Dict[str, Any]
    position_x: float
    position_y: float
    width: float
    height: float
    anchor: Optional[str] = "center"

class WidgetCreate(WidgetBase):
    pass

class WidgetUpdate(BaseModel):
    type: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    width: Optional[float] = None
    height: Optional[float] = None
    anchor: Optional[str] = None

class Widget(WidgetBase):
    id: int
    created_at: datetime
    updated_at: datetime
    user_id: int

    class Config:
        from_attributes = True

# Схемы для User
class UserBase(BaseModel):
    username: str
    name: str

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    password: Optional[str] = None

class User(UserBase):
    id: int
    is_admin: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserAdmin(User):
    subscription: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

# Схемы для Subscription
class SubscriptionBase(BaseModel):
    activation_date: Optional[datetime] = None
    expiration_date: Optional[datetime] = None
    is_active: bool = False

class SubscriptionCreate(SubscriptionBase):
    user_id: int

class Subscription(SubscriptionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

# Схемы для авторизации
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None 