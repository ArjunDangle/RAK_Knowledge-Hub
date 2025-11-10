# server/app/routers/cms_router.py
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from typing import List, Optional

from app.services.confluence_service import ConfluenceService
from app.services.permission_service import PermissionService
from app.services.submission_repository import SubmissionRepository
from app.schemas import cms_schemas, content_schemas, auth_schemas
from app.schemas.content_schemas import PageTreeNodeWithPermission, PageTreeNode
from app.schemas.cms_schemas import ContentNode
from app.config import settings
from .auth_router import get_current_user, get_current_admin_user

router = APIRouter(
    prefix="/cms",
    tags=["CMS"]
)

# Instantiate the service and new repository
confluence_service = ConfluenceService(settings)
submission_repo = SubmissionRepository()
permission_service = PermissionService()

@router.get(
    "/admin/content-index",
    response_model=List[ContentNode],
    dependencies=[Depends(get_current_admin_user)]
)
async def get_content_index(parent_id: Optional[str] = Query(None)):
    """
    Provides a hierarchical tree of content. If parent_id is provided, fetches children of that node.
    """
    content_nodes = await confluence_service.get_content_index_nodes(parent_id)
    return content_nodes

@router.post(
    "/attachments/upload",
    response_model=cms_schemas.AttachmentResponse,
    dependencies=[Depends(get_current_user)]
)
async def upload_attachment_endpoint(file: UploadFile = File(...)):
    # This logic is self-contained and does not call the service logic we refactored.
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
async def get_page_tree_structure(parent_id: Optional[str] = Query(None)):
    """
    Fetches the page hierarchy in a tree structure for the CMS from the local database.
    - If `parent_id` is not provided, returns the top-level root pages.
    - If `parent_id` is provided, returns the direct children of that page.
    """
    return await confluence_service.get_page_tree(parent_id)

@router.get(
    "/pages/tree-with-permissions",
    response_model=List[PageTreeNodeWithPermission],
    dependencies=[Depends(get_current_user)]
)
@router.get(
    "/pages/tree-with-permissions",
    response_model=List[PageTreeNodeWithPermission],
    dependencies=[Depends(get_current_user)]
)
async def get_page_tree_with_permissions_endpoint(
    parent_id: Optional[str] = Query(None),
    allowed_only: bool = Query(False),
    current_user: auth_schemas.UserResponse = Depends(get_current_user)
):
    """
    Fetches the page hierarchy for the create page, including a permission flag
    for each node indicating if the current user can create children under it.
    Can optionally filter to show only allowed nodes and their ancestors.
    """
    return await confluence_service.get_page_tree_with_permissions(current_user, parent_id, allowed_only)

@router.post(
    "/pages/create", 
    response_model=cms_schemas.PageCreateResponse,
    dependencies=[Depends(get_current_user)]
)
async def create_page(
    page_data: cms_schemas.PageCreate,
    current_user: auth_schemas.UserResponse = Depends(get_current_user)
):
    """Orchestrates page creation via the Confluence service."""
    created_page = await confluence_service.create_page_for_review(page_data, current_user.id, current_user.name)
    if not created_page:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create page in Confluence."
        )
    return created_page

@router.get(
    "/admin/edit-details/{page_id}",
    response_model=cms_schemas.PageDetailResponse,
    dependencies=[Depends(get_current_admin_user)]
)
async def get_page_details_for_edit_endpoint(page_id: str):
    """
    Fetches the combined data for a page from both the DB and Confluence,
    for populating the admin edit form.
    """
    page_details = await confluence_service.get_page_details_for_edit(page_id)
    if not page_details:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Details for page with ID '{page_id}' could not be found."
        )
    return page_details

@router.put(
    "/pages/update/{page_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def update_page_endpoint(
    page_id: str,
    page_data: cms_schemas.PageUpdate,
    current_user: auth_schemas.UserResponse = Depends(get_current_user)
):
    """
    Updates an existing page.
    Authorization is now handled by the PermissionService.
    """
    # Authorization Check
    has_permission = await permission_service.user_has_edit_permission(page_id, current_user)
    
    if not has_permission:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this article."
        )

    # If check passes, proceed with the update
    success = await confluence_service.update_page(page_id, page_data, current_user.name)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the page."
        )
    return

@router.get(
    "/admin/preview/{page_id}",
    response_model=content_schemas.Article,
    dependencies=[Depends(get_current_admin_user)]
)
async def get_article_preview_endpoint(page_id: str):
    """
    Fetches the full content of a pending article for an admin to preview.
    """
    article = await confluence_service.get_article_for_preview(page_id)
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
async def get_pages_pending_review():
    """Fetches all submissions pending review."""
    return await confluence_service.get_pending_submissions()

@router.post(
    "/admin/pages/{page_id}/approve", 
    status_code=status.HTTP_204_NO_CONTENT, 
    dependencies=[Depends(get_current_admin_user)]
)
async def approve_page_endpoint(page_id: str):
    """Approves a page."""
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
    """Rejects a page."""
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
    # --- UPDATED: Use SubmissionRepository for auth check ---
    submission = await submission_repo.get_by_confluence_id(page_id)
    if not submission or submission.authorId != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to resubmit this article."
        )
    # --- END UPDATED SECTION ---

    success = await confluence_service.resubmit_page_for_review(page_id, current_user.name)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to resubmit page.")
    return

@router.delete(
    "/admin/pages/{page_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(get_current_admin_user)]
)
async def delete_page_permanently_endpoint(page_id: str):
    """
    Deletes a page from Confluence and its corresponding record from the local database.
    """
    success = await confluence_service.delete_page_permanently(page_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete the page from Confluence or the local database."
        )
    return

@router.get(
    "/admin/content-index/search",
    response_model=List[ContentNode],
    dependencies=[Depends(get_current_admin_user)]
)
async def search_content_index_endpoint(query: str = Query(..., min_length=2)):
    """
    Searches the content index for pages matching the query and returns a flat list.
    """
    return await confluence_service.search_content_index(query)

