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
    managedPageConfluenceId: str | None = None # Accept the string ID from the frontend

class GroupResponse(BaseModel):
    id: int
    name: str
    managedPageConfluenceId: str | None = None # Return the string ID to the frontend
    
    class Config:
        from_attributes = True

class GroupWithMembersResponse(GroupResponse):
    members: List[auth_schemas.UserResponse] = []


router = APIRouter(
    prefix="/groups",
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
    groups = await db.group.find_many(include={'members': True, 'managedPage': True})
    
    # Manually construct response to include the managedPage's confluenceId
    response = []
    for group in groups:
        group_dict = group.model_dump()
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
    # First, disconnect all members to avoid constraint issues
    await db.group.update(where={'id': group_id}, data={'members': {'set': []}})
    await db.group.delete(where={'id': group_id})
    return

@router.post("/{group_id}/members/{user_id}", response_model=GroupWithMembersResponse)
async def add_member_to_group(group_id: int, user_id: int):
    updated_group = await db.group.update(
        where={'id': group_id},
        data={'members': {'connect': [{'id': user_id}]}},
        include={'members': True}
    )
    return updated_group

@router.delete("/{group_id}/members/{user_id}", response_model=GroupWithMembersResponse)
async def remove_member_from_group(group_id: int, user_id: int):
    updated_group = await db.group.update(
        where={'id': group_id},
        data={'members': {'disconnect': [{'id': user_id}]}},
        include={'members': True}
    )
    return updated_group

@router.get("/users/all", response_model=List[auth_schemas.UserResponse])
async def get_all_users():
    users = await db.user.find_many(order={'name': 'asc'})
    return users