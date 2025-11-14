# server/app/routers/tag_router.py

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel

from app.db import db
# --- CORRECTED IMPORTS ---
from .auth_router import get_current_admin_user, get_current_user
# --- END CORRECTION ---
from prisma.models import TagGroup, Tag

# --- Pydantic Schemas ---
class TagGroupCreate(BaseModel):
    name: str
    description: str | None = None

class TagCreate(BaseModel):
    name: str
    tagGroupId: int

class TagGroupResponse(BaseModel):
    id: int
    name: str
    description: str | None
    order: int
    class Config: from_attributes = True

class TagResponse(BaseModel):
    id: int
    name: str
    slug: str
    tagGroupId: int
    class Config: from_attributes = True

class GroupedTagResponse(TagGroupResponse):
    tags: List[TagResponse] = []

# --- API Router ---
# --- CORRECTION: REMOVED THE GLOBAL ADMIN DEPENDENCY ---
router = APIRouter(
    tags=["Tags"]
)
# --- END CORRECTION ---

# --- Endpoints for Tag Groups ---

@router.post("/groups", response_model=TagGroupResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin_user)])
async def create_tag_group(group_data: TagGroupCreate):
    existing = await db.taggroup.find_unique(where={'name': group_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="A tag group with this name already exists.")
    new_group = await db.taggroup.create(data=group_data.model_dump())
    return new_group

@router.get("/groups", response_model=List[TagGroupResponse], dependencies=[Depends(get_current_admin_user)])
async def get_all_tag_groups():
    return await db.taggroup.find_many(order={'order': 'asc'})

# --- CORRECTION: This endpoint should be accessible by any logged-in user ---
@router.get("/grouped", response_model=List[GroupedTagResponse], dependencies=[Depends(get_current_user)])
async def get_all_tags_grouped():
    return await db.taggroup.find_many(
        where={'name': {'not': 'legacy'}},
        include={'tags': {'order_by': {'name': 'asc'}}},
        order=[{'order': 'asc'}, {'name': 'asc'}]
    )
# --- END CORRECTION ---

@router.get("/groups/with-tags", response_model=List[GroupedTagResponse], dependencies=[Depends(get_current_admin_user)])
async def get_all_tag_groups_with_tags_admin():
    return await db.taggroup.find_many(
        include={'tags': {'order_by': {'name': 'asc'}}},
        order=[{'order': 'asc'}, {'name': 'asc'}]
    )

@router.put("/groups/{group_id}", response_model=TagGroupResponse, dependencies=[Depends(get_current_admin_user)])
async def update_tag_group(group_id: int, group_data: TagGroupCreate):
    return await db.taggroup.update(where={'id': group_id}, data=group_data.model_dump())

@router.delete("/groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
async def delete_tag_group(group_id: int):
    tag_count = await db.tag.count(where={'tagGroupId': group_id})
    if tag_count > 0:
        raise HTTPException(status_code=400, detail="Cannot delete a group that contains tags.")
    await db.taggroup.delete(where={'id': group_id})
    return

# --- Endpoints for Individual Tags ---

@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(get_current_admin_user)])
async def create_tag(tag_data: TagCreate):
    import re
    slug = re.sub(r'[\s_&]+', '-', tag_data.name.lower())
    slug = re.sub(r'[^\w-]', '', slug)
    
    group = await db.taggroup.find_unique(where={'id': tag_data.tagGroupId})
    if group and group.name == 'legacy':
        raise HTTPException(status_code=400, detail="Cannot add new tags to the 'legacy' group.")

    new_tag = await db.tag.create(data={'name': tag_data.name, 'slug': slug, 'tagGroupId': tag_data.tagGroupId})
    return new_tag

@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(get_current_admin_user)])
async def delete_tag(tag_id: int):
    try:
        await db.tag.delete(where={'id': tag_id})
    except Exception as e:
        raise HTTPException(status_code=400, detail="Cannot delete tag. It is currently associated with one or more articles.")
    return