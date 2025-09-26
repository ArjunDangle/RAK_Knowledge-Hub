# In server/app/schemas/cms_schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class ArticleSubmissionStatus(str, Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    REJECTED = "REJECTED"
    PUBLISHED = "PUBLISHED"

class AttachmentInfo(BaseModel):
    temp_id: str
    file_name: str

class PageCreate(BaseModel):
    title: str
    content: str
    parent_id: str
    tags: List[str] = []
    attachments: List[AttachmentInfo] = []
    
# --- ADD THIS NEW MODEL ---
class PageReject(BaseModel):
    comment: Optional[str] = Field(None, min_length=1)

class PageCreateResponse(BaseModel):
    id: str
    title: str
    status: str

class ArticleSubmissionResponse(BaseModel):
    id: int
    confluencePageId: str
    title: str
    status: ArticleSubmissionStatus
    updatedAt: datetime

    class Config:
        from_attributes = True

class AttachmentResponse(BaseModel):
    temp_id: str
    file_name: str