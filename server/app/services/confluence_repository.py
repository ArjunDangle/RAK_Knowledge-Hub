# server/app/services/confluence_repository.py
import re
import os
import mimetypes
from typing import List, Dict, Optional, Any
from atlassian import Confluence
from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse

from app.config import Settings
from app.schemas.cms_schemas import AttachmentInfo
from app.schemas.content_schemas import Tag

UPLOAD_DIR = "/tmp/uploads"

ROOT_PAGE_CONFIG = [
    {
        "confluence_title": "Resource Centre",
        "slug": "resource-centre",
        "display_title": "Resource Centre",
        "description": "Comprehensive knowledge base and documentation",
        "icon": "BookOpen"
    },
    # {
    #     "confluence_title": "Department",
    #     "slug": "departments",
    #     "display_title": "Departments",
    #     "description": "Resources organized by team functions",
    #     "icon": "Building2"
    # },
    # {
    #     "confluence_title": "Tools",
    #     "slug": "tools",
    #     "display_title": "Tools",
    #     "description": "Development tools, utilities, and platform guides",
    #     "icon": "Wrench"
    # }
]

class ConfluenceRepository:
    """
    Handles all raw API communication with the Atlassian Confluence service.
    This is the only class that should import from 'atlassian' and make API calls.
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        self.confluence = Confluence(
            url=self.settings.confluence_url,
            username=self.settings.confluence_username,
            password=self.settings.confluence_api_token,
            cloud=True
        )
        self.root_page_ids = self._discover_root_pages()
        self.id_to_group_slug_map = {v: k for k, v in self.root_page_ids.items()}

    def _discover_root_pages(self) -> Dict[str, str]:
        """Dynamically discovers root pages based on the ROOT_PAGE_CONFIG."""
        space_key = self.settings.confluence_space_key
        discovered_ids = {}
        
        # --- MODIFIED LOGIC ---
        for config in ROOT_PAGE_CONFIG:
            title = config["confluence_title"]
            slug = config["slug"]
            try:
                search_path = f'/rest/api/content?spaceKey={space_key}&title={title}&limit=1'
                results = self.confluence.get(search_path).get('results', [])
                if results and not results[0].get('parent'):
                    page_id = results[0]['id']
                    discovered_ids[slug] = page_id
            except Exception as e:
                print(f"FATAL: Could not discover root page titled '{title}'. Error: {e}")
        
        if not discovered_ids:
            print("CRITICAL: No root pages found in Confluence. Please check space key and page titles.")
            
        return discovered_ids

    def _slugify(self, text: str) -> str:
        """Helper to create a URL-friendly slug."""
        text = text.lower()
        text = re.sub(r'[\s_&]+', '-', text)
        text = re.sub(r'[^\w\s-]', '', text)
        return text

    def get_tag_by_name(self, name: str) -> Tag:
        """Helper to create a Tag object from a name."""
        return Tag(id=0, name=name, slug=self._slugify(name))

    # --- Page & Content Methods ---

    def get_page_by_id(self, page_id: str, expand: str = "body.view,version,metadata.labels,ancestors") -> Optional[Dict[str, Any]]:
        """Fetches a full page object from Confluence by its ID."""
        try:
            page_data = self.confluence.get_page_by_id(page_id, expand=expand)
            if not page_data:
                return None
            return page_data
        except Exception as e:
            print(f"Error fetching page ID {page_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not fetch page {page_id} from Confluence."
            )

    def get_page_content(self, page_id: str) -> str:
        """Fetches only the 'body.view' content of a page."""
        try:
            page_data = self.confluence.get_page_by_id(page_id, expand="body.view")
            return page_data.get("body", {}).get("view", {}).get("value", "")
        except Exception as e:
            print(f"Error fetching content for page {page_id}: {e}")
            raise HTTPException(status_code=503, detail=f"Could not fetch content for page {page_id}.")

    def get_child_pages(self, page_id: str) -> List[Dict[str, Any]]:
        """Fetches the immediate children of a page."""
        try:
            # The atlassian-python-api's get_child_pages method does not take a limit argument.
            # It returns a generator that we convert to a list.
            return list(self.confluence.get_child_pages(page_id))
        except Exception as e:
            print(f"Error fetching children for page {page_id}: {e}")
            return []

    def check_has_children(self, page_id: str) -> bool:
        """Checks if a page has any children."""
        try:
            # Get the generator for child pages.
            child_pages_generator = self.confluence.get_child_pages(page_id)
            # Try to get the first item from the generator. If it exists, the page has children.
            first_child = next(child_pages_generator, None)
            return first_child is not None
        except Exception as e:
            print(f"Error checking children for page {page_id}: {e}")
            return False

    def create_page(self, title: str, parent_id: str, content_storage_format: str, author_name: str) -> Dict[str, Any]:
        """Creates a new page in Confluence."""
        try:
            new_page = self.confluence.create_page(
                space=self.settings.confluence_space_key,
                title=title,
                parent_id=parent_id,
                body=content_storage_format,
                representation='storage'
            )
            if not new_page:
                raise Exception("Page creation returned null")
            return new_page
        except Exception as e:
            print(f"Error creating Confluence page: {e}")
            raise

    def update_page(self, page_id: str, title: str, body: str, current_version_number: int, version_comment: str, parent_id: Optional[str] = None) -> Dict[str, Any]:
        """Updates an existing page in Confluence."""
        try:
            updated_page = self.confluence.update_page(
                page_id=page_id,
                title=title,
                body=body, # The content is passed via this parameter.
                parent_id=parent_id,
                version_comment=version_comment,
                representation='storage'
            )
            if not updated_page:
                raise Exception("Page update returned null")
            return updated_page
        except Exception as e:
            print(f"Error updating Confluence page {page_id}: {e}")
            raise

    def delete_page(self, page_id: str):
        """Deletes a page from Confluence."""
        try:
            self.confluence.remove_page(page_id=page_id)
        except Exception as e:
            print(f"Error deleting Confluence page {page_id}: {e}")
            raise

    # --- Label & Comment Methods ---

    def add_label(self, page_id: str, label_name: str):
        """Adds a label to a Confluence page."""
        try:
            self.confluence.set_page_label(page_id, label_name)
        except Exception as e:
            print(f"Error adding label '{label_name}' to page {page_id}: {e}")

    def remove_label(self, page_id: str, label_name: str):
        """Removes a label from a Confluence page."""
        try:
            self.confluence.remove_page_label(page_id, label_name)
        except Exception as e:
            print(f"Error removing label '{label_name}' from page {page_id}: {e}")

    def post_comment(self, page_id: str, comment_text: str):
        """Posts a comment to a Confluence page."""
        try:
            self.confluence.add_comment(page_id=page_id, text=comment_text)
        except Exception as e:
            print(f"Error posting comment to page {page_id}: {e}")

    # --- Search & CQL Methods ---

    def search_cql(self, cql: str, start: int = 0, limit: int = 25, expand: str = "") -> Dict[str, Any]:
        """Runs a raw CQL search."""
        try:
            search_path = f'/rest/api/content/search?cql={cql}&start={start}&limit={limit}&expand={expand}'
            return self.confluence.get(search_path)
        except Exception as e:
            print(f"Error during CQL search: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to search content from Confluence."
            )

    # --- Attachment Methods ---

    def upload_attachments(self, page_id: str, attachments: List[AttachmentInfo]):
        """Uploads a list of temporary files to a Confluence page."""
        attachment_url = f"{self.settings.confluence_url}/rest/api/content/{page_id}/child/attachment"
        headers = {"X-Atlassian-Token": "no-check"}
        
        for attachment in attachments:
            temp_file_path = os.path.join(UPLOAD_DIR, attachment.temp_id)
            if os.path.exists(temp_file_path):
                try:
                    content_type, _ = mimetypes.guess_type(attachment.file_name)
                    content_type = content_type or 'application/octet-stream'
                    
                    with open(temp_file_path, 'rb') as file_handle:
                        files = {'file': (attachment.file_name, file_handle, content_type)}
                        response = self.confluence.session.post(attachment_url, headers=headers, files=files)
                        response.raise_for_status()
                except Exception as e:
                    print(f"Error uploading attachment {attachment.file_name}: {e}")
                finally:
                    os.remove(temp_file_path)

    def get_attachment_data(self, page_id: str, file_name: str) -> Optional[StreamingResponse]:
        """Gets the raw data for a single attachment to stream back to the client."""
        try:
            attachments = self.confluence.get_attachments_from_content(page_id=page_id, limit=200)
            target_attachment = next((att for att in attachments['results'] if att['title'] == file_name), None)
            
            if not target_attachment:
                print(f"Attachment '{file_name}' not found on page {page_id}")
                return None
            
            download_link = self.settings.confluence_url + target_attachment['_links']['download']
            
            response = self.confluence.session.get(download_link, stream=True)
            response.raise_for_status()
            
            mimetype, _ = mimetypes.guess_type(file_name)
            media_type = mimetype or 'application/octet-stream'
            
            return StreamingResponse(response.iter_content(chunk_size=8192), media_type=media_type)
        except Exception as e:
            print(f"Error fetching attachment '{file_name}' for page ID {page_id}: {e}")
            raise HTTPException(status_code=503, detail="Could not retrieve attachment.")

