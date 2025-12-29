# server/app/routers/auth_router.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import timedelta
from jose import JWTError, jwt
from typing import Optional, List
from app import security
from app.db import db
from app.schemas import auth_schemas
from app.schemas.auth_schemas import UserRoleUpdate, AdminPasswordReset
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)
router = APIRouter(tags=["Authentication"])


async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if token is None:
        raise credentials_exception
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = auth_schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = await db.user.find_unique(
        where={'username': token_data.username},
        include={
            'groupMemberships': {
                'include': {
                    'group': {
                        'include': {'managedPage': True}
                    }
                }
            }
        }
    )
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
    
    user = await db.user.find_unique(
        where={'username': token_data.username},
        include={
            'groupMemberships': {
                'include': {
                    'group': {
                        'include': {'managedPage': True}
                    }
                }
            }
        }
    )
    return user

@router.post("/admin/register", response_model=auth_schemas.UserResponse, dependencies=[Depends(get_current_admin_user)])
async def register_user_by_admin(user_data: auth_schemas.UserCreate):
    """
    Admin-only endpoint to create a new user (either ADMIN or MEMBER).
    """
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
            'name': user_data.name,
            'hashed_password': hashed_password,
            'role': user_data.role
        },
        include={'groupMemberships': True}
    )
    return new_user

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
            'name': user_data.name,
            'hashed_password': hashed_password,
            'role': user_data.role
        },
        include={'groupMemberships': True}
    )
    return new_user


@router.post("/token") 
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await db.user.find_unique(
        where={'username': form_data.username},
        include={
            'groupMemberships': {
                'include': {
                    'group': {
                        'include': {'managedPage': True}
                    }
                }
            }
        }
    )
    
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
        "user": user
    }

@router.get("/users/me", response_model=auth_schemas.UserResponse)
async def read_users_me(current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    return current_user

# --- ADMIN USER MANAGEMENT ENDPOINTS ---

@router.get("/users", response_model=List[auth_schemas.UserResponse], dependencies=[Depends(get_current_admin_user)])
async def get_all_users_admin():
    """Fetches all users for the admin management page."""
    users = await db.user.find_many(
        order={'createdAt': 'desc'},
        include={
            'groupMemberships': {
                'include': {
                    'group': {
                        'include': {'managedPage': True}
                    }
                }
            }
        }
    )
    return users

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
async def delete_user(user_id: int, current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    """Deletes a user. Prevents self-deletion and handles cascade deletes manually."""
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    
    try:
        # 1. Delete Notifications sent to this user
        await db.notification.delete_many(where={'recipientId': user_id})

        # 2. Delete Article Submissions by this user
        # This removes the submission status/history from the database.
        # The actual Page content remains but will fallback to the stored author string.
        await db.articlesubmission.delete_many(where={'authorId': user_id})

        # 3. Delete the User
        # Group memberships (implicit many-to-many) are automatically cleaned up by Prisma.
        await db.user.delete(where={'id': user_id})
        
    except Exception as e:
        print(f"Error deleting user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"An error occurred while deleting the user: {str(e)}")
    return

@router.patch("/users/{user_id}/role", response_model=auth_schemas.UserResponse, dependencies=[Depends(get_current_admin_user)])
async def update_user_role(user_id: int, role_data: UserRoleUpdate, current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    """Updates a user's role (ADMIN <-> MEMBER). Prevents self-demotion."""
    if user_id == current_user.id and role_data.role != "ADMIN":
        raise HTTPException(status_code=400, detail="You cannot demote yourself.")
    
    if role_data.role not in ["ADMIN", "MEMBER"]:
        raise HTTPException(status_code=400, detail="Invalid role.")

    updated_user = await db.user.update(
        where={'id': user_id},
        data={'role': role_data.role}
    )
    return updated_user

@router.post("/users/{user_id}/reset-password", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
async def admin_reset_password(user_id: int, payload: AdminPasswordReset):
    """Allows an admin to force-reset a user's password."""
    hashed_password = security.hash_password(payload.password)
    await db.user.update(
        where={'id': user_id},
        data={'hashed_password': hashed_password}
    )
    return