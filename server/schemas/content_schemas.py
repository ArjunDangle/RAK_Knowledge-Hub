# schemas/content_schemas.py
from pydantic import BaseModel
from typing import List, Optional, Union
from typing_extensions import Literal # <-- ADDED THIS IMPORT

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
    type: Literal["subsection"] = "subsection" # <-- ADDED THIS LINE
    id: str
    slug: str
    title: str
    description: str
    group: str
    tags: List[Tag]
    articleCount: int
    updatedAt: str

class Article(BaseModel):
    type: Literal["article"] = "article" # <-- ADDED THIS LINE
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

# NEW: Define a type that can be either a Subsection or an Article
PageContentItem = Union[Subsection, Article]

# Add this class to the end of the file

class Ancestor(BaseModel):
    id: str
    title: str