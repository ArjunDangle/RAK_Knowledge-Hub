# In server/app/schemas/cms_schemas.py
from pydantic import BaseModel
from typing import List

class AttachmentInfo(BaseModel):
    temp_id: str
    file_name: str

class PageCreate(BaseModel):
    title: str
    content: str
    parent_id: str
    tags: List[str] = []
    attachments: List[AttachmentInfo] = []

class PageCreateResponse(BaseModel):
    id: str
    title: str
    status: str

class AttachmentResponse(BaseModel):
    temp_id: str
    file_name: str