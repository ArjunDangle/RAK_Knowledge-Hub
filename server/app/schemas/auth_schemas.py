# server/schemas/auth_schemas.py
from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    password: str
    role: str # 'MEMBER' or 'ADMIN'

class UserResponse(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True