# server/app/schemas/auth_schemas.py
from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ManagedPageSummary(BaseModel):
    id: int
    confluenceId: str
    title: str

    class Config:
        from_attributes = True

class GroupSummary(BaseModel):
    id: int
    name: str
    managedPage: Optional[ManagedPageSummary] = None

    class Config:
        from_attributes = True

class GroupRole(str, Enum):
    MEMBER = "MEMBER"
    ADMIN = "ADMIN"

class GroupMembership(BaseModel):
    groupId: int
    role: GroupRole
    group: GroupSummary

    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    username: str
    name: str
    password: str
    role: str

class UserResponse(BaseModel):
    id: int
    username: str
    name: str
    role: str
    groupMemberships: List[GroupMembership] = []

    class Config:
        from_attributes = True

class UserRoleUpdate(BaseModel):
    role: str

class AdminPasswordReset(BaseModel):
    password: str