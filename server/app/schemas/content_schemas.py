# schemas/content_schemas.py
from pydantic import BaseModel
from typing import List, Optional, Union
from typing_extensions import Literal

class Tag(BaseModel):
    id: int
    name: str
    slug: str

class GroupInfo(BaseModel):
    id: str
    title: str
    description: str
    icon: str

class Subsection(BaseModel):
    type: Literal["subsection"] = "subsection"
    id: str
    slug: str
    title: str
    description: str
    html: str
    group: str
    tags: List[Tag]
    articleCount: int
    updatedAt: str

class Article(BaseModel):
    type: Literal["article"] = "article"
    id: str
    slug: str
    title: str
    excerpt: str
    html: str
    tags: List[Tag]
    group: str
    subsection: str 
    updatedAt: str
    views: int
    readMinutes: int
    author: Optional[str] = None

    class Config:
        from_attributes = True

# --- THIS IS THE FIX ---
# Re-adding the PageContentItem type alias
PageContentItem = Union[Article, Subsection]
# --- END OF FIX ---

# This is a paginated response wrapper
class PaginatedResponse(BaseModel):
    items: List[PageContentItem] # Use the type alias here
    total: int
    page: int
    pageSize: int
    hasNext: bool

class Ancestor(BaseModel):
    id: str
    title: str
    slug: str

class PageTreeNode(BaseModel):
    id: str
    title: str
    hasChildren: bool

