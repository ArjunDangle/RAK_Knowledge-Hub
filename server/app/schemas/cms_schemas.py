# In server/app/schemas/cms_schemas.py
from pydantic import BaseModel
from typing import List

class PageCreate(BaseModel):
    title: str
    content: str
    parent_id: str  # The ID of the parent page (subsection) in Confluence
    tags: List[str] = []

class PageCreateResponse(BaseModel):
    id: str
    title: str
    status: str