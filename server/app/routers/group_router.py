# server/app/routers/group_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.db import db
from .auth_router import get_current_admin_user
from app.schemas import auth_schemas

from pydantic import BaseModel

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

@router.get("", response_model=List[GroupWithMembersResponse])
async def get_all_groups():
    groups = await db.group.find_many(
        include={
            'memberships': {
                'include': {
                    'user': {
                        # FIX: Deep include required for UserResponse schema validation
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
    
    # Transform the data to match the expected response format (User list)
    response = []
    for group in groups:
        group_dict = group.model_dump()
        # Manually reconstruct the 'members' list from 'memberships'
        group_dict['members'] = [m.user for m in group.memberships]
        group_dict['managedPageConfluenceId'] = group.managedPage.confluenceId if group.managedPage else None
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
    # With the explicit GroupMember table and onDelete: Cascade, 
    # we just delete the group directly. Prisma handles the rest.
    await db.group.delete(where={'id': group_id})
    return

@router.post("/{group_id}/members/{user_id}", response_model=GroupWithMembersResponse)
async def add_member_to_group(group_id: int, user_id: int):
    # Create the membership record directly
    await db.groupmember.create(
        data={
            'userId': user_id,
            'groupId': group_id,
            'role': 'MEMBER' 
        }
    )
    
    # Fetch and return the updated group
    updated_group = await db.group.find_unique(
        where={'id': group_id},
        include={
            'memberships': {
                'include': {
                    'user': {
                        # FIX: Deep include
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
async def remove_member_from_group(group_id: int, user_id: int):
    # Delete the unique membership entry
    await db.groupmember.delete_many(
        where={
            'userId': user_id,
            'groupId': group_id
        }
    )
    
    # Fetch and return updated group
    updated_group = await db.group.find_unique(
        where={'id': group_id},
        include={
            'memberships': {
                'include': {
                    'user': {
                        # FIX: Deep include
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
@router.get("/users/all", response_model=List[auth_schemas.UserResponse])
async def get_all_users():
    users = await db.user.find_many(
        order={'name': 'asc'},
        include={'groupMemberships': {'include': {'group': True}}}
    )
    return users

@router.patch("/{group_id}/members/{user_id}", response_model=GroupWithMembersResponse)
async def update_group_member_role(group_id: int, user_id: int, role_data: MemberRoleUpdate):
    if role_data.role not in ["ADMIN", "MEMBER"]:
        raise HTTPException(status_code=400, detail="Invalid role")

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
                        # FIX: Deep include
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