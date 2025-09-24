# In server/app/routers/cms_router.py
import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List

from app.services.confluence_service import ConfluenceService
from app.schemas import cms_schemas, content_schemas, auth_schemas
from app.config import settings
from .auth_router import get_current_user, get_current_admin_user

router = APIRouter(
    prefix="/cms",
    tags=["CMS"]
)

confluence_service = ConfluenceService(settings)

# ADD THIS NEW ENDPOINT
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
# END OF NEW ENDPOINT

@router.post(
    "/pages/create", 
    response_model=cms_schemas.PageCreateResponse,
    dependencies=[Depends(get_current_user)]
)
def create_page(
    page_data: cms_schemas.PageCreate,
    current_user: auth_schemas.UserResponse = Depends(get_current_user)
):
    created_page = confluence_service.create_page_for_review(page_data, current_user.username)
    if not created_page:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create page in Confluence."
        )
    return created_page

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
def approve_page_endpoint(page_id: str):
    success = confluence_service.approve_page(page_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to approve page.")
    return

@router.post(
    "/admin/pages/{page_id}/reject", 
    status_code=status.HTTP_204_NO_CONTENT, 
    dependencies=[Depends(get_current_admin_user)]
)
def reject_page_endpoint(page_id: str):
    success = confluence_service.reject_page(page_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to reject page.")
    return