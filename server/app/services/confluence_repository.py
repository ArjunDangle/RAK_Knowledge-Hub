# server/app/services/confluence_repository.py
import mimetypes
import os
import time
from typing import List, Dict, Optional, Any
from atlassian import Confluence
from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse

from app.config import Settings
from app.utils.html_translator import html_to_storage_format
from app.schemas.cms_schemas import AttachmentInfo

UPLOAD_DIR = "/tmp/uploads"

class ConfluenceRepository:
    """
    Handles all raw API communication with the Confluence service.
    This is the ONLY class that should import and use the `atlassian.Confluence` client.
    It returns raw dictionaries or handles API-level exceptions.
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        try:
            self.confluence = Confluence(
                url=self.settings.confluence_url,
                username=self.settings.confluence_username,
                password=self.settings.confluence_api_token,
                cloud=True
            )
            # Store the space key for easy reuse
            self.space_key = self.settings.confluence_space_key
            self.root_page_ids = self._discover_root_pages()
            self.id_to_group_slug_map = {v: k for k, v in self.root_page_ids.items()}
            if not self.root_page_ids:
                print("CRITICAL: Could not discover any root page IDs. Confluence integration may fail.")
        except Exception as e:
            print(f"FATAL: Could not initialize Confluence client. Error: {e}")
            raise

    def _discover_root_pages(self) -> Dict[str, str]:
        """Discovers the top-level root pages (e.g., "Departments") on startup."""
        discovered_ids = {}
        expected_titles = { 
            "Department": "departments", 
            "Resource Centre": "resource-centre", 
            "Tools": "tools" 
        }
        
        for title, slug in expected_titles.items():
            try:
                search_path = f'/rest/api/content?spaceKey={self.space_key}&title={title}&limit=1'
                results = self.confluence.get(search_path).get('results', [])
                
                if results and not results[0].get('parent'):
                    page_id = results[0]['id']
                    discovered_ids[slug] = page_id
            except Exception as e:
                print(f"FATAL: Could not discover root page titled '{title}'. Error: {e}")
        return discovered_ids

    # --- Page Read Operations ---

    def get_page_by_id(self, page_id: str, expand: str) -> Optional[Dict[str, Any]]:
        """Fetches a single page from Confluence with a specific expansion."""
        try:
            return self.confluence.get_page_by_id(page_id, expand=expand)
        except Exception as e:
            print(f"Error fetching page {page_id} from Confluence: {e}")
            return None

    def get_page_ancestors(self, page_id: str) -> List[Dict[str, Any]]:
        """Fetches the list of ancestors for a given page."""
        try:
            return self.confluence.get_page_ancestors(page_id)
        except Exception as e:
            print(f"Error fetching ancestors for {page_id}: {e}")
            return []

    def get_child_pages(self, page_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Fetches the direct children (stubs) of a page."""
        try:
            return list(self.confluence.get_child_pages(page_id, limit=limit))
        except Exception as e:
            print(f"Error fetching children for {page_id}: {e}")
            return []

    def search_cql(self, cql: str, start: int = 0, limit: int = 25, expand: str = "") -> Dict[str, Any]:
        """Runs a raw CQL query."""
        try:
            return self.confluence.cql(cql, start=start, limit=limit, expand=expand)
        except Exception as e:
            print(f"Error executing CQL: {cql}. Error: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Search service is currently unavailable."
            )

    # --- Page Write Operations ---

    def create_page(self, title: str, parent_id: str, content_storage_format: str, author_name: str) -> Optional[Dict[str, Any]]:
        """Creates a new page in Confluence."""
        try:
            full_content = f"<p><em>Submitted by: {author_name}</em></p>{content_storage_format}"
            
            return self.confluence.create_page(
                space=self.space_key,
                title=title,
                parent_id=parent_id,
                body=full_content,
                representation='storage'
            )
        except Exception as e:
            print(f"Error creating page '{title}' in Confluence: {e}")
            return None

    def update_page(self, page_id: str, title: str, content_storage_format: str, version_comment: str) -> bool:
        """Updates an existing page's title and content."""
        try:
            # We need the current version number to perform an update
            current_page = self.confluence.get_page_by_id(page_id, expand="version")
            if not current_page:
                print(f"Error updating page: Page {page_id} not found in Confluence.")
                return False

            self.confluence.update_page(
                page_id=page_id,
                title=title,
                body=content_storage_format,
                parent_id=None, # We are not changing the parent
                version_comment=version_comment,
                representation='storage'
            )
            return True
        except Exception as e:
            print(f"Error updating page {page_id} in Confluence: {e}")
            return False

    def delete_page(self, page_id: str) -> bool:
        """Trashes a page in Confluence. (Not permanent delete)."""
        try:
            self.confluence.remove_page(page_id=page_id)
            return True
        except Exception as e:
            print(f"Error deleting page {page_id} from Confluence: {e}")
            return False

    # --- Label and Comment Operations ---

    def add_label(self, page_id: str, label_name: str):
        """Adds a label to a Confluence page."""
        try:
            self.confluence.set_page_label(page_id, label_name)
        except Exception as e:
            print(f"Error adding label '{label_name}' to {page_id}: {e}")

    def remove_label(self, page_id: str, label_name: str):
        """Removes a label from a Confluence page."""
        try:
            self.confluence.remove_page_label(page_id, label_name)
        except Exception as e:
            print(f"Error removing label '{label_name}' from {page_id}: {e}")

    def add_comment(self, page_id: str, comment_text: str):
        """Posts a comment to a Confluence page."""
        try:
            self.confluence.add_comment(page_id=page_id, text=comment_text)
        except Exception as e:
            print(f"Error adding comment to {page_id}: {e}")

    # --- Attachment Operations ---

    def upload_attachments(self, page_id: str, attachments: List[AttachmentInfo]):
        """Uploads a list of temporary files as attachments to a Confluence page."""
        
        # Give Confluence a moment to process the new page before attaching files
        time.sleep(1) 
        
        attachment_url = f"{self.settings.confluence_url}/rest/api/content/{page_id}/child/attachment"
        headers = {"X-Atlassian-Token": "no-check"}
        
        for attachment in attachments:
            temp_file_path = os.path.join(UPLOAD_DIR, attachment.temp_id)
            if not os.path.exists(temp_file_path):
                print(f"Warning: Temp file not found, skipping attachment upload: {attachment.file_name}")
                continue
            
            try:
                content_type, _ = mimetypes.guess_type(attachment.file_name)
                content_type = content_type or 'application/octet-stream'
                
                with open(temp_file_path, 'rb') as file_handle:
                    files = {'file': (attachment.file_name, file_handle, content_type)}
                    response = self.confluence.session.post(attachment_url, headers=headers, files=files)
                    response.raise_for_status()
            except Exception as e:
                print(f"Error uploading attachment {attachment.file_name} to {page_id}: {e}")
            finally:
                # Clean up the temp file
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

    def get_attachment_data(self, page_id: str, file_name: str) -> Optional[StreamingResponse]:
        """Gets the raw data for a single attachment to stream back to the client."""
        try:
            attachments = self.confluence.get_attachments_from_content(page_id=page_id, limit=200)
            target_attachment = next((att for att in attachments['results'] if att['title'] == file_name), None)
            
            if not target_attachment:
                raise HTTPException(status_code=404, detail="Attachment not found.")
            
            download_link = self.settings.confluence_url + target_attachment['_links']['download']
            
            # Use the raw session from the client to get a streaming response
            response = self.confluence.session.get(download_link, stream=True)
            response.raise_for_status()
            
            mimetype, _ = mimetypes.guess_type(file_name)
            media_type = mimetype or 'application/octet-stream'
            
            return StreamingResponse(response.iter_content(chunk_size=8192), media_type=media_type)
        except Exception as e:
            print(f"Error fetching attachment '{file_name}' for page ID {page_id}: {e}")
            if isinstance(e, HTTPException): 
                raise e
            raise HTTPException(status_code=503, detail="Could not retrieve attachment from Confluence.")

