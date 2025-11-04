# server/app/routers/knowledge_router.py
from fastapi import APIRouter, HTTPException, Query, Response, Depends
from typing import List, Optional, Dict, Any

from app.services.confluence_service import ConfluenceService
from app.schemas import content_schemas
from app.config import settings

router = APIRouter()
confluence_service = ConfluenceService(settings)

@router.get("/groups", response_model=List[content_schemas.GroupInfo], tags=["Knowledge Hub"])
def get_groups():
    """
    Returns static information about the three main content groups.
    """
    return confluence_service.get_groups()

@router.get("/subsections/{group_slug}", response_model=List[content_schemas.Subsection], tags=["Knowledge Hub"])
async def get_subsections_by_group_slug(group_slug: str):
    """
    Fetches the top-level subsections for a given group (e.g., 'departments')
    by querying the local database.
    """
    subsections = await confluence_service.get_subsections_by_group(group_slug)
    if not subsections:
        # This is expected if the group is empty, but a 404 might be misleading
        # if the group slug itself was invalid. The service handles the 404.
        pass
    return subsections

@router.get("/contents/by-parent/{parent_id}", response_model=Dict[str, Any], tags=["Knowledge Hub"])
async def get_page_contents(
    parent_id: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100)
):
    """
    Fetches paginated contents (children) of a given parent page
    directly from the local database.
    """
    try:
        return await confluence_service.get_page_contents_from_db(parent_id, page, pageSize)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in get_page_contents router: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch page contents.")

@router.get("/article/{page_id}", response_model=content_schemas.Article, tags=["Knowledge Hub"])
async def get_article(page_id: str):
    """
    HYBRID FETCH: Fetches article metadata from the local DB and its
    live content from Confluence.
    """
    article_data = await confluence_service.get_article_by_id_hybrid(page_id)
    if not article_data:
        raise HTTPException(status_code=404, detail=f"Article with ID '{page_id}' not found.")
    return article_data

@router.get("/page/{page_id}", response_model=content_schemas.Subsection, tags=["Knowledge Hub"])
async def get_page_by_id(page_id: str):
    """
    HYBRID FETCH: Fetches subsection metadata from the local DB and its
    live content from Confluence.
    """
    page_data = await confluence_service.get_subsection_by_id_hybrid(page_id)
    if not page_data:
        raise HTTPException(status_code=404, detail=f"Page with ID '{page_id}' not found or is not a subsection.")
    return page_data

@router.get("/ancestors/{page_id}", response_model=List[content_schemas.Ancestor], tags=["Knowledge Hub"])
async def get_ancestors(page_id: str):
    """
    Fetches the ancestor hierarchy for a given page from the local DB.
    """
    return await confluence_service.get_ancestors(page_id)

@router.get("/search", response_model=Dict[str, Any], tags=["Knowledge Hub"])
async def search_knowledge_hub(
    q: str = Query(..., min_length=2, description="Search query string"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=50)
):
    """
    HYBRID SEARCH: Searches Confluence for relevant page IDs, then enriches
    those IDs with metadata from the local DB.
    """
    try:
        return await confluence_service.search_content_hybrid(query=q, page=page, page_size=pageSize)
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error in search_knowledge_hub router: {e}")
        raise HTTPException(status_code=500, detail="Search failed.")

@router.get("/articles/popular", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
async def get_popular_articles(limit: int = 6):
    """
    Fetches the most popular articles (by views) from the local DB.
    """
    return await confluence_service.get_popular_articles(limit=limit)

@router.get("/articles/recent", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
async def get_recent_articles(limit: int = 6):
    """
    Fetches the most recently updated articles from the local DB.
    """
    return await confluence_service.get_recent_articles(limit=limit)

@router.get("/whats-new", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
async def get_whats_new(limit: int = 20):
    """
    Fetches the "what's new" feed (most recent articles) from the local DB.
    """
    return await confluence_service.get_whats_new(limit)

@router.get("/tags", response_model=List[content_schemas.Tag], tags=["Knowledge Hub"])
async def get_all_tags_endpoint():
    """
    Fetches all unique tags from the local DB.
    """
    return await confluence_service.get_all_tags()

@router.get("/attachment/{page_id}/{file_name}", tags=["Knowledge Hub"])
def get_attachment(page_id: str, file_name: str):
    """
    Streams an attachment file (like an image or PDF) directly from Confluence.
    """
    try:
        attachment_stream = confluence_service.get_attachment_data(page_id, file_name)
        if not attachment_stream:
            raise HTTPException(status_code=404, detail="Attachment not found.")
        
        # Return the streaming response from the service
        return attachment_stream
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Error getting attachment: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve attachment.")

