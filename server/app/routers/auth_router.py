# server/app/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from jose import JWTError, jwt
from typing import Optional
from app import security
from app.db import db
from app.schemas import auth_schemas
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)
router = APIRouter(tags=["Authentication"])

# ... (get_current_user and get_current_admin_user functions are unchanged) ...
async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = auth_schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await db.user.find_unique(where={'username': token_data.username})
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin_user(current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    if current_user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have administrative privileges"
        )
    return current_user

async def get_current_user_optional(token: Optional[str] = Depends(oauth2_scheme)):
    if token is None:
        return None
        
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            return None
        token_data = auth_schemas.TokenData(username=username)
    except JWTError:
        return None
    
    user = await db.user.find_unique(where={'username': token_data.username})
    return user

@router.post("/register", response_model=auth_schemas.UserResponse)
async def register_user(user_data: auth_schemas.UserCreate):
    existing_user = await db.user.find_unique(where={'username': user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_password = security.hash_password(user_data.password)
    
    new_user = await db.user.create(
        data={
            'username': user_data.username,
            'name': user_data.name,  # <-- SAVE THE NAME
            'hashed_password': hashed_password,
            'role': user_data.role
        }
    )
    return new_user

@router.post("/token") 
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.user.find_unique(where={'username': form_data.username})
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
         
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "username": user.username,
            "name": user.name, # <-- INCLUDE THE NAME IN RESPONSE
            "role": user.role
        }
    }

@router.get("/users/me", response_model=auth_schemas.UserResponse)
async def read_users_me(current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    return current_user