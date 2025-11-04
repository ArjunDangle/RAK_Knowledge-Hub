# server/app/routers/knowledge_router.py
from fastapi import APIRouter, HTTPException, Query, Response
from typing import List, Optional

from app.db import db # <-- IMPORT THE DATABASE
from app.services.confluence_service import ConfluenceService
from app.schemas import content_schemas
from app.config import settings

router = APIRouter()
confluence_service = ConfluenceService(settings)

# This endpoint is no longer needed; 
# get_groups is static and can be removed
# or kept for frontend convenience if desired. Let's keep it for now.
@router.get("/groups", response_model=List[content_schemas.GroupInfo], tags=["Knowledge Hub"])
def get_groups():
    return confluence_service.get_groups()

# --- THIS IS THE NEW ENDPOINT THAT FIXES THE 404s ---
@router.get("/subsections/{group_slug}", response_model=List[content_schemas.Subsection], tags=["Knowledge Hub"])
async def get_subsections_by_group_slug(group_slug: str):
    """
    NEW: Fetches the top-level subsections for a given group (e.g., 'departments')
    by querying the local database.
    """
    # 1. Find the parent "group" page (e.g., "Departments") by its slug.
    #    We get the slug from the root_page_ids map in the service.
    root_page_id = confluence_service.root_page_ids.get(group_slug)
    
    if not root_page_id:
        raise HTTPException(status_code=404, detail=f"Group with slug '{group_slug}' not found.")

    # 2. Find all direct children of that root page
    child_pages = await db.page.find_many(
        where={
            'parentConfluenceId': root_page_id,
            'pageType': 'SUBSECTION' # Ensure we only get subsections
        },
        include={'tags': True},
        order={'title': 'asc'}
    )
    
    # 3. Format them as Subsection objects
    subsections = []
    for page in child_pages:
        # We need to get the article count for each subsection
        article_count = await db.page.count(
            where={'parentConfluenceId': page.confluenceId, 'pageType': 'ARTICLE'}
        )
        
        subsections.append(
            content_schemas.Subsection(
                type='subsection',
                id=page.confluenceId,
                slug=page.slug,
                title=page.title,
                description=page.description,
                html="", # List view doesn't need HTML
                group=group_slug,
                tags=page.tags,
                articleCount=article_count,
                updatedAt=page.updatedAt.isoformat()
            )
        )
    return subsections
# --- END OF NEW ENDPOINT ---

# REFACTORED: Now uses the database and supports pagination
@router.get("/contents/by-parent/{parent_id}", response_model=dict, tags=["Knowledge Hub"])
async def get_page_contents(
    parent_id: str,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100)
):
    """
    Fetches paginated contents (children) of a given parent page directly from the local database.
    """
    return await confluence_service.get_page_contents_from_db(parent_id, page, pageSize)

# REFACTORED: Implements the hybrid model (DB for metadata, Confluence for content)
@router.get("/article/{page_id}", response_model=content_schemas.Article, tags=["Knowledge Hub"])
async def get_article(page_id: str):
    """
    Fetches article metadata from the local DB and its content from Confluence.
    """
    article_data = await confluence_service.get_article_by_id_hybrid(page_id)
    if not article_data:
        raise HTTPException(status_code=404, detail=f"Article with ID '{page_id}' not found.")
    return article_data

# REFACTORED: The logic for pages (subsections) and articles is now unified.
# This endpoint now fetches from the same hybrid source as /article/{page_id}.
@router.get("/page/{page_id}", response_model=content_schemas.Article, tags=["Knowledge Hub"])
async def get_page_by_id(page_id: str):
    """
    Fetches page metadata from the local DB and its content from Confluence.
    (This is now an alias for the get_article endpoint).
    """
    page_data = await confluence_service.get_article_by_id_hybrid(page_id)
    if not page_data:
        raise HTTPException(status_code=404, detail=f"Page with ID '{page_id}' not found.")
    return page_data

# This endpoint can now be powered by a recursive DB query if needed,
# but the current Confluence implementation is acceptable for now. No changes needed.
@router.get("/ancestors/{page_id}", response_model=List[content_schemas.Ancestor], tags=["Knowledge Hub"])
def get_ancestors(page_id: str):
    return confluence_service.get_ancestors(page_id)

# REFACTORED: Implements the new hybrid search with pagination
@router.get("/search", response_model=dict, tags=["Knowledge Hub"])
async def search_knowledge_hub(
    q: str = Query(..., min_length=2),
  
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=50)
):
    """
    Performs a hybrid search: gets IDs from Confluence, then enriches with local DB metadata.
    """
    return await confluence_service.search_content_hybrid(query=q, page=page, page_size=pageSize)

# The following endpoints are now obsolete as they can be replaced by more specific DB queries
# For now, we will leave them but they should be considered for removal.
@router.get("/articles/popular", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def get_popular_articles(limit: int = 6):
    return confluence_service.get_popular_articles(limit=limit)

@router.get("/articles/recent", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def get_recent_articles(limit: int = 6):
    return confluence_service.get_recent_articles(limit=limit)

@router.get("/whats-new", response_model=List[content_schemas.Article], tags=["Knowledge Hub"])
def get_whats_new():
    return confluence_service.get_whats_new()
# End of obsolete endpoints

@router.get("/tags", response_model=List[content_schemas.Tag], tags=["Knowledge Hub"])
def get_all_tags_endpoint():
    # This should be refactored to query the local Tag table.
    # For now, we leave the old implementation.
    return confluence_service.get_all_tags()

@router.get("/attachment/{page_id}/{file_name}", tags=["Knowledge Hub"])
def get_attachment(page_id: str, file_name: str):
    # This endpoint's logic remains valid as it deals with Confluence directly.
    attachment_stream = confluence_service.get_attachment_data(page_id, file_name)
    if not attachment_stream:
        raise HTTPException(status_code=404, detail="Attachment not found.")
    
    return Response(content=attachment_stream.iter_content(chunk_size=8192), media_type=attachment_stream.headers['Content-Type'])