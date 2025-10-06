# In server/app/routers/cms_router.py
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from typing import List, Optional

from app.services.confluence_service import ConfluenceService
from app.db import db
from app.schemas import cms_schemas, content_schemas, auth_schemas
from app.schemas.content_schemas import PageTreeNode
from app.schemas.cms_schemas import ContentNode # <-- THIS IS THE FIX
from app.config import settings
from .auth_router import get_current_user, get_current_admin_user

router = APIRouter(
    prefix="/cms",
    tags=["CMS"]
)

confluence_service = ConfluenceService(settings)

@router.get(
    "/admin/content-index",
    response_model=List[ContentNode],
    dependencies=[Depends(get_current_admin_user)]
)
async def get_content_index():
    """
    Provides a complete, hierarchical tree of all content in the knowledge hub,
    enriched with author and status information for administrative purposes.
    """
    content_tree = await confluence_service.get_full_content_tree()
    return content_tree

@router.post(
    "/attachments/upload",
    response_model=cms_schemas.AttachmentResponse,
    dependencies=[Depends(get_current_user)]
)
async def upload_attachment_endpoint(file: UploadFile = File(...)):
    UPLOAD_DIR = "/tmp/uploads"
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    temp_id = f"{uuid.uuid4()}-{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, temp_id)

    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {e}"
        )

    return cms_schemas.AttachmentResponse(temp_id=temp_id, file_name=file.filename)

@router.get(
    "/pages/tree",
    response_model=List[PageTreeNode],
    dependencies=[Depends(get_current_user)]
)
def get_page_tree_structure(parent_id: Optional[str] = Query(None)):
    """
    Fetches the page hierarchy in a tree structure for the CMS.
    - If `parent_id` is not provided, returns the top-level root pages.
    - If `parent_id` is provided, returns the direct children of that page.
    """
    return confluence_service.get_page_tree(parent_id)

@router.post(
    "/pages/create", 
    response_model=cms_schemas.PageCreateResponse,
    dependencies=[Depends(get_current_user)]
)
async def create_page(
    page_data: cms_schemas.PageCreate,
    current_user: auth_schemas.UserResponse = Depends(get_current_user)
):
    created_page = await confluence_service.create_page_for_review(page_data, current_user.id, current_user.name)
    if not created_page:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create page in Confluence."
        )
    return created_page

@router.get(
    "/admin/preview/{page_id}",
    response_model=content_schemas.Article,
    dependencies=[Depends(get_current_admin_user)]
)
def get_article_preview_endpoint(page_id: str):
    """
    Fetches the full content of a pending article for an admin to preview.
    Bypasses the regular status checks for publication.
    """
    article = confluence_service.get_article_for_preview(page_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article with ID '{page_id}' not found."
        )
    return article

@router.get(
    "/admin/pending", 
    response_model=List[content_schemas.Article], 
    dependencies=[Depends(get_current_admin_user)]
)
def get_pages_pending_review():
    return confluence_service.get_pending_pages()

@router.post(
    "/admin/pages/{page_id}/approve", 
    status_code=status.HTTP_204_NO_CONTENT, 
    dependencies=[Depends(get_current_admin_user)]
)
async def approve_page_endpoint(page_id: str):
    success = await confluence_service.approve_page(page_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to approve page.")
    return

@router.post(
    "/admin/pages/{page_id}/reject", 
    status_code=status.HTTP_204_NO_CONTENT, 
    dependencies=[Depends(get_current_admin_user)]
)
async def reject_page_endpoint(page_id: str, payload: cms_schemas.PageReject):
    success = await confluence_service.reject_page(page_id, payload.comment)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to reject page.")
    return

@router.get(
    "/my-submissions",
    response_model=List[cms_schemas.ArticleSubmissionResponse],
    dependencies=[Depends(get_current_user)]
)
async def get_my_submissions(current_user: auth_schemas.UserResponse = Depends(get_current_user)):
    """
    Fetches all articles submitted by the currently authenticated user.
    """
    submissions = await confluence_service.get_submissions_by_author(current_user.id)
    return submissions

@router.post(
    "/pages/{page_id}/resubmit",
    status_code=status.HTTP_204_NO_CONTENT
)
async def resubmit_page_endpoint(
    page_id: str,
    current_user: auth_schemas.UserResponse = Depends(get_current_user)
):
    """
    Allows an author to resubmit their own rejected article for review.
    """
    # Security Check: Ensure the user owns this submission
    submission = await db.articlesubmission.find_unique(where={'confluencePageId': page_id})
    if not submission or submission.authorId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to resubmit this article."
        )

    success = await confluence_service.resubmit_page_for_review(page_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to resubmit page.")
    return