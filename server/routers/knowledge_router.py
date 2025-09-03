# routers/knowledge_router.py
from fastapi import APIRouter, HTTPException, Query
from typing import List
from services.confluence_service import ConfluenceService
from schemas import content_schemas
from config import settings

router = APIRouter()
confluence_service = ConfluenceService(settings)

@router.get("/groups", response_model=List[content_schemas.GroupInfo], tags=["Knowledge Hub"])
def get_groups():
    return confluence_service.get_groups()

@router.get("/subsections/{group_slug}", response_model=List[content_schemas.Subsection], tags=["Knowledge Hub"])
def get_subsections(group_slug: str):
    subsections = confluence_service.get_subsections_by_group(group_slug)
    if not subsections:
        raise HTTPException(status_code=404, detail=f"Group '{group_slug}' not found or has no subsections.")
    return subsections

@router.get("/contents/by-parent/{parent_id}", response_model=List[content_schemas.PageContentItem], tags=["Knowledge Hub"])
def get_page_contents(parent_id: str):
    return confluence_service.get_page_contents(parent_id)

# --- ENDPOINT NOW USES ID ---
@router.get("/article/{page_id}", response_model=content_schemas.Article, tags=["Knowledge Hub"])
def get_article(page_id: str):
    article = confluence_service.get_article_by_id(page_id)
    if not article:
        raise HTTPException(status_code=404, detail=f"Article with ID '{page_id}' not found.")
    return article

# --- ENDPOINT NOW USES ID ---
@router.get("/page/{page_id}", response_model=content_schemas.Subsection, tags=["Knowledge Hub"])
def get_page_by_id(page_id: str):
    page = confluence_service.get_page_by_id(page_id)
    if not page:
        raise HTTPException(status_code=404, detail=f"Page with ID '{page_id}' not found.")
    return page

@router.get("/search", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def search_knowledge_hub(q: str = Query(..., min_length=3), tags: List[str] = Query(None)):
    return confluence_service.search_content(query=q, labels=tags)

@router.get("/articles/popular", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def get_popular_articles(limit: int = 6):
    return confluence_service.get_whats_new(limit=limit)

@router.get("/articles/recent", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def get_recent_articles(limit: int = 6):
    return confluence_service.get_whats_new(limit=limit)

@router.get("/whats-new", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def get_whats_new():
    return confluence_service.get_whats_new()