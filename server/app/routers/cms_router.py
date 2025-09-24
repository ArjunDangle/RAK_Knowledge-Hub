# In server/app/routers/cms_router.py
import os
import uuid
import shutil
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

# Define a directory for temporary uploads
UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post(
    "/attachments/upload",
    response_model=cms_schemas.AttachmentResponse,
    dependencies=[Depends(get_current_user)]
)
async def upload_attachment(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file name provided.")

    temp_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, temp_id)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()
    
    return {"temp_id": temp_id, "file_name": file.filename}


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