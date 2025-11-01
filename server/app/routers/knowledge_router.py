# server/app/routers/knowledge_router.py
from fastapi import APIRouter, HTTPException, Query, Response
from typing import List

from app.services.confluence_service import ConfluenceService
from app.schemas import content_schemas
from app.config import settings

router = APIRouter()
confluence_service = ConfluenceService(settings)

# ... (all endpoints remain the same)
@router.get("/groups", response_model=List[content_schemas.GroupInfo], tags=["Knowledge Hub"])
def get_groups():
    return confluence_service.get_groups()

@router.get("/subsections/{group_slug}", response_model=List[content_schemas.Subsection], tags=["Knowledge Hub"])
def get_subsections(group_slug: str):
    subsections = confluence_service.get_subsections_by_group(group_slug)
    return subsections

@router.get("/contents/by-parent/{parent_id}", response_model=List[content_schemas.PageContentItem], tags=["Knowledge Hub"])
def get_page_contents(parent_id: str):
    return confluence_service.get_page_contents(parent_id)

@router.get("/article/{page_id}", response_model=content_schemas.Article, tags=["Knowledge Hub"])
def get_article(page_id: str):
    article = confluence_service.get_article_by_id(page_id)
    if not article:
        raise HTTPException(status_code=404, detail=f"Article with ID '{page_id}' not found.")
    return article

@router.get("/page/{page_id}", response_model=content_schemas.Subsection, tags=["Knowledge Hub"])
def get_page_by_id(page_id: str):
    page = confluence_service.get_page_by_id(page_id)
    if not page:
        raise HTTPException(status_code=404, detail=f"Page with ID '{page_id}' not found.")
    return page

@router.get("/ancestors/{page_id}", response_model=List[content_schemas.Ancestor], tags=["Knowledge Hub"])
def get_ancestors(page_id: str):
    return confluence_service.get_ancestors(page_id)

@router.get("/search", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def search_knowledge_hub(
    q: str = Query(..., min_length=3), 
    tags: List[str] = Query(None),
    mode: str = Query("all", enum=["all", "title", "tags", "content"])
):
    return confluence_service.search_content(query=q, labels=tags, mode=mode)

@router.get("/articles/popular", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def get_popular_articles(limit: int = 6):
    return confluence_service.get_popular_articles(limit=limit)

@router.get("/articles/recent", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def get_recent_articles(limit: int = 6):
    return confluence_service.get_recent_articles(limit=limit)

@router.get("/whats-new", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def get_whats_new():
    return confluence_service.get_whats_new()

@router.get("/tags", response_model=List[content_schemas.Tag], tags=["Knowledge Hub"])
def get_all_tags_endpoint():
    return confluence_service.get_all_tags()

@router.get("/attachment/{page_id}/{file_name}", tags=["Knowledge Hub"])
def get_attachment(page_id: str, file_name: str, response: Response):
    attachment_stream = confluence_service.get_attachment_data(page_id, file_name)
    if not attachment_stream:
        raise HTTPException(status_code=404, detail="Attachment not found or access denied.")
    
    response.headers["Content-Disposition"] = "inline"
    response.headers["Access-Control-Allow-Origin"] = "*"
    
    return attachment_stream