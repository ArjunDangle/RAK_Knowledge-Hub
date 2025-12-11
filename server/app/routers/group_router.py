# server/app/routers/group_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel

from app.db import db
from .auth_router import get_current_admin_user, get_current_user
from app.schemas import auth_schemas

# --- Pydantic Models ---
class GroupCreate(BaseModel):
    name: str

class GroupUpdate(BaseModel):
    name: str
    managedPageConfluenceId: str | None = None

class GroupResponse(BaseModel):
    id: int
    name: str
    managedPageConfluenceId: str | None = None
    
    class Config:
        from_attributes = True

class GroupWithMembersResponse(GroupResponse):
    members: List[auth_schemas.UserResponse] = []

class MemberRoleUpdate(BaseModel):
    role: str # "ADMIN" or "MEMBER"

# CHANGED: Removed global 'dependencies=[Depends(get_current_admin_user)]'
router = APIRouter(
    tags=["Groups"]
)

# --- Helper to verify Group Admin permission ---
async def verify_group_management_permission(group_id: int, current_user: auth_schemas.UserResponse):
    """
    Allows access if user is Global ADMIN OR is an ADMIN of the specific group.
    """
    if current_user.role == "ADMIN":
        return True
    
    # Check specific group membership role
    membership = await db.groupmember.find_unique(
        where={
            'userId_groupId': {
                'userId': current_user.id,
                'groupId': group_id
            }
        }
    )
    
    if not membership or membership.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You do not have permission to manage this group."
        )
    return True

# --- Endpoints ---

@router.post("", response_model=GroupResponse, dependencies=[Depends(get_current_admin_user)])
async def create_group(group_data: GroupCreate):
    """Only Global Admins can create new groups."""
    existing = await db.group.find_unique(where={'name': group_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="A group with this name already exists.")
    new_group = await db.group.create(data={'name': group_data.name})
    return new_group

@router.get("", response_model=List[GroupWithMembersResponse])
async def get_all_groups(current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    """
    Global Admins see ALL groups.
    Group Admins see ONLY groups where they are an ADMIN.
    """
    
    where_clause = {}
    
    # Filter for non-global admins
    if current_user.role != "ADMIN":
        where_clause = {
            'memberships': {
                'some': {
                    'userId': current_user.id,
                    'role': 'ADMIN' # Only fetch groups where user is an Admin
                }
            }
        }

    groups = await db.group.find_many(
        where=where_clause,
        include={
            'memberships': {
                'include': {
                    'user': {
                        'include': {
                            'groupMemberships': {
                                'include': {
                                    'group': {
                                        'include': {'managedPage': True}
                                    }
                                }
                            }
                        }
                    } 
                }
            },
            'managedPage': True
        }
    )
    
    response = []
    for group in groups:
        group_dict = group.model_dump()
        group_dict['members'] = [m.user for m in group.memberships]
        group_dict['managedPageConfluenceId'] = group.managedPage.confluenceId if group.managedPage else None
        response.append(group_dict)
    return response

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: int, 
    group_data: GroupUpdate,
    current_user: auth_schemas.UserResponse = Depends(get_current_user)
):
    """Group Admins can update name/root page of their own groups."""
    await verify_group_management_permission(group_id, current_user)

    page_id_to_connect = None
    if group_data.managedPageConfluenceId:
        page = await db.page.find_unique(where={'confluenceId': group_data.managedPageConfluenceId})
        if not page:
            raise HTTPException(status_code=404, detail="Selected managed page not found.")
        page_id_to_connect = page.id

    updated_group = await db.group.update(
        where={'id': group_id},
        data={
            'name': group_data.name, 
            'managedPageId': page_id_to_connect
        }
    )
    return updated_group

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
async def delete_group(group_id: int):
    """Only Global Admins can delete groups completely."""
    await db.group.delete(where={'id': group_id})
    return

@router.post("/{group_id}/members/{user_id}", response_model=GroupWithMembersResponse)
async def add_member_to_group(
    group_id: int, 
    user_id: int,
    current_user: auth_schemas.UserResponse = Depends(get_current_user)
):
    """Group Admins can add members to their groups."""
    await verify_group_management_permission(group_id, current_user)

    await db.groupmember.create(
        data={
            'userId': user_id,
            'groupId': group_id,
            'role': 'MEMBER' 
        }
    )
    
    updated_group = await db.group.find_unique(
        where={'id': group_id},
        include={
            'memberships': {
                'include': {
                    'user': {
                        'include': {
                            'groupMemberships': {
                                'include': {
                                    'group': {
                                        'include': {'managedPage': True}
                                    }
                                }
                            }
                        }
                    }
                }
            }, 
            'managedPage': True
        }
    )
    
    group_dict = updated_group.model_dump()
    group_dict['members'] = [m.user for m in updated_group.memberships]
    return group_dict

@router.delete("/{group_id}/members/{user_id}", response_model=GroupWithMembersResponse)
async def remove_member_from_group(
    group_id: int, 
    user_id: int,
    current_user: auth_schemas.UserResponse = Depends(get_current_user)
):
    """Group Admins can remove members from their groups."""
    await verify_group_management_permission(group_id, current_user)

    await db.groupmember.delete_many(
        where={
            'userId': user_id,
            'groupId': group_id
        }
    )
    
    updated_group = await db.group.find_unique(
        where={'id': group_id},
        include={
            'memberships': {
                'include': {
                    'user': {
                        'include': {
                            'groupMemberships': {
                                'include': {
                                    'group': {
                                        'include': {'managedPage': True}
                                    }
                                }
                            }
                        }
                    }
                }
            }, 
            'managedPage': True
        }
    )
    
    group_dict = updated_group.model_dump()
    group_dict['members'] = [m.user for m in updated_group.memberships]
    return group_dict

@router.patch("/{group_id}/members/{user_id}", response_model=GroupWithMembersResponse)
async def update_group_member_role(
    group_id: int, 
    user_id: int, 
    role_data: MemberRoleUpdate,
    current_user: auth_schemas.UserResponse = Depends(get_current_user)
):
    """Group Admins can promote/demote within their groups."""
    await verify_group_management_permission(group_id, current_user)

    if role_data.role not in ["ADMIN", "MEMBER"]:
        raise HTTPException(status_code=400, detail="Invalid role")

    # Prevent self-demotion
    if user_id == current_user.id and role_data.role != "ADMIN":
        raise HTTPException(status_code=400, detail="You cannot demote yourself.")

    await db.groupmember.update(
        where={
            'userId_groupId': { 
                'userId': user_id,
                'groupId': group_id
            }
        },
        data={'role': role_data.role}
    )
    
    updated_group = await db.group.find_unique(
        where={'id': group_id},
        include={
            'memberships': {
                'include': {
                    'user': {
                        'include': {
                            'groupMemberships': {
                                'include': {
                                    'group': {
                                        'include': {'managedPage': True}
                                    }
                                }
                            }
                        }
                    }
                }
            }, 
            'managedPage': True
        }
    )
    
    group_dict = updated_group.model_dump()
    group_dict['members'] = [m.user for m in updated_group.memberships]
    return group_dict

@router.get("/users/all", response_model=List[auth_schemas.UserResponse], dependencies=[Depends(get_current_user)])
async def get_all_users():
    """Allow all authenticated users to see the user list (needed for selecting new members)."""
    users = await db.user.find_many(
        order={'name': 'asc'},
        include={'groupMemberships': {'include': {'group': True}}}
    )
    return users