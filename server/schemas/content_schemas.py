# schemas/content_schemas.py
from pydantic import BaseModel
from typing import List, Optional, Union
from typing_extensions import Literal

class Tag(BaseModel):
    id: str
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

PageContentItem = Union[Subsection, Article]

class Ancestor(BaseModel):
    id: str
    title: str