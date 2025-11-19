# server/app/routers/group_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Literal # <-- FIX: Added Literal import
from pydantic import BaseModel

from app.db import db
from .auth_router import get_current_admin_user
from app.schemas import auth_schemas

# Define a type for group roles to enforce consistency
GroupRole = Literal["MEMBER", "GROUP_ADMIN"]

# --- Schemas for this router ---

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

class GroupWithMembershipsResponse(GroupResponse):
    memberships: List[dict] = []

class MemberUpdateRequest(BaseModel):
    userId: int
    role: GroupRole

# --- Router setup ---

router = APIRouter(
    tags=["Groups"],
    dependencies=[Depends(get_current_admin_user)]
)

@router.post("", response_model=GroupResponse)
async def create_group(group_data: GroupCreate):
    existing = await db.group.find_unique(where={'name': group_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="A group with this name already exists.")
    new_group = await db.group.create(data={'name': group_data.name})
    return new_group

@router.get("", response_model=List[GroupWithMembershipsResponse])
async def get_all_groups():
    groups = await db.group.find_many(
        include={
            'memberships': {
                'include': {
                    'user': True
                }
            },
            'managedPage': True
        }
    )
    
    response = []
    for group in groups:
        group_dict = group.model_dump(exclude={'memberships'})
        group_dict['managedPageConfluenceId'] = group.managedPage.confluenceId if group.managedPage else None
        
        memberships_response = []
        for membership in group.memberships:
            if membership.user:
                memberships_response.append({
                    'userId': membership.userId,
                    'role': membership.role,
                    'user': {
                        'id': membership.user.id,
                        'name': membership.user.name,
                        'username': membership.user.username,
                    }
                })
        group_dict['memberships'] = memberships_response
        response.append(group_dict)
        
    return response

@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(group_id: int, group_data: GroupUpdate):
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

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: int):
    # First, delete all membership records associated with this group
    await db.groupmembership.delete_many(where={'groupId': group_id})
    # Then, delete the group itself
    await db.group.delete(where={'id': group_id})
    return

@router.put("/{group_id}/members", status_code=status.HTTP_204_NO_CONTENT)
async def add_or_update_member_in_group(group_id: int, update_data: MemberUpdateRequest):
    """
    Adds a member to a group if they don't exist, or updates their role if they do.
    This single endpoint handles both creation and role changes.
    """
    await db.groupmembership.upsert(
        where={'userId_groupId': {'userId': update_data.userId, 'groupId': group_id}},
        data={
            'create': {
                'userId': update_data.userId,
                'groupId': group_id,
                'role': update_data.role
            },
            'update': {
                'role': update_data.role
            }
        }
    )
    return

@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member_from_group(group_id: int, user_id: int):
    """Removes a user's membership from a group, regardless of their role."""
    try:
        await db.groupmembership.delete(where={'userId_groupId': {'userId': user_id, 'groupId': group_id}})
    except Exception:
        # If the record doesn't exist, we can just pass silently as the desired state is achieved.
        pass
    return
# --- END FIX ---


@router.get("/users/all", response_model=List[auth_schemas.UserResponse])
async def get_all_users():
    users = await db.user.find_many(
        order={'name': 'asc'},
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