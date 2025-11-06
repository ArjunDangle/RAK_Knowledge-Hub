# server/app/schemas/cms_schemas.py
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
    description: str
    content: str
    parent_id: str # This is the parent's Confluence ID
    tags: List[str] = []
    attachments: List[AttachmentInfo] = []

# NEW: Add this model for the update endpoint
class PageUpdate(BaseModel):
    title: str
    description: str
    content: str
    
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

class ContentNode(BaseModel):
    id: str
    title: str
    author: Optional[str] = None
    status: ArticleSubmissionStatus
    updatedAt: datetime
    confluenceUrl: str
    children: List['ContentNode'] = []
    hasChildren: bool = False

ContentNode.model_rebuild()

class AttachmentResponse(BaseModel):
    temp_id: str
    file_name: str

class PageDetailResponse(BaseModel):
    title: str
    description: str
    content: str
    parent_id: Optional[str] = None
    tags: List[str] = []

class PageUpdate(BaseModel):
    title: str
    description: str
    content: str
    parent_id: Optional[str] = None
    tags: List[str] = []