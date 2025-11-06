# server/one_time_import.py
import asyncio
from bs4 import BeautifulSoup
# --- THIS IS THE FIX: Add 'Optional' to the import from typing ---
from typing import List, Dict, Optional

# This allows the script to import from our app structure
from app.db import db
from app.services.confluence_service import ConfluenceService
from app.config import settings
from prisma.enums import PageType

# Instantiate the Confluence service to use its connection and helper methods
confluence_service = ConfluenceService(settings)

async def process_page_and_children(page_id: str, parent_confluence_id: str = None):
    """
    Recursively fetches a Confluence page, saves its metadata to the local DB,
    and then does the same for all of its children.
    """
    print(f"Processing page ID: {page_id}...")
    try:
        # 1. Fetch the full page data using the repository
        page_data = confluence_service.confluence_repo.get_page_by_id(
            page_id, expand="body.view,version,metadata.labels"
        )
        if not page_data:
            print(f"  -> WARN: Could not fetch page data for ID {page_id}. Skipping.")
            return

        # 2. Extract Metadata (this logic is correct)
        title = page_data["title"]
        author_name = page_data.get("version", {}).get("by", {}).get("displayName", "Unknown")
        updated_at = page_data["version"]["when"]
        
        html_content = page_data.get("body", {}).get("view", {}).get("value", "")
        plain_text = BeautifulSoup(html_content, 'html.parser').get_text(" ", strip=True)
        description = (plain_text[:250] + '...') if len(plain_text) > 250 else plain_text
        if not description:
            description = "No description available."

        # 3. Determine Page Type using the repository
        children = confluence_service.confluence_repo.get_child_pages(page_id)
        page_type = PageType.SUBSECTION if children else PageType.ARTICLE

        # 4. Save the Page to our database using the PageRepository
        # This reuses the same logic as our main application, which is more robust.
        await confluence_service.page_repo.create_or_update_page(
            confluence_id=page_id,
            title=title,
            slug=confluence_service._slugify(title),
            description=description,
            page_type=page_type,
            parent_confluence_id=parent_confluence_id,
            author_name=author_name,
            updated_at_str=updated_at,
            raw_labels=page_data.get("metadata", {}).get("labels", {}).get("results", [])
        )
        print(f"  -> SUCCESS: Synced page '{title}'")

        # 5. Recurse for all children
        for child in children:
            await process_page_and_children(child['id'], parent_confluence_id=page_id)

    except Exception as e:
        print(f"  -> ERROR: Failed to process page ID {page_id}. Reason: {e}")

async def main():
    """
    Main function to start the import process.
    """
    print("--- Starting Confluence Data Import ---")
    await db.connect()
    try:
        # Access the root page IDs from the repository via the service
        root_page_ids = confluence_service.confluence_repo.root_page_ids
        
        if not root_page_ids:
            print("CRITICAL: No root pages found in Confluence. Aborting sync.")
            return
            
        print(f"Found root pages: {list(root_page_ids.keys())}")

        for slug, page_id in root_page_ids.items():
            # The parent of the root pages is None.
            await process_page_and_children(page_id, parent_confluence_id=None)

    finally:
        await db.disconnect()
        print("--- Confluence Data Import Finished ---")

# This is a temporary helper method to make the script work.
# It is attached to the PageRepository class below.
async def create_or_update_page(
    self, confluence_id: str, title: str, slug: str, description: str, 
    page_type: PageType, parent_confluence_id: Optional[str], author_name: str, 
    updated_at_str: str, raw_labels: List[Dict]
):
    tag_connect_ops = []
    for label in raw_labels:
        tag_name = label["name"]
        if tag_name.startswith("status-"): continue
        
        tag_slug = self._slugify(tag_name)
        tag = await db.tag.upsert(
            where={'name': tag_name},
            data={'create': {'name': tag_name, 'slug': tag_slug}, 'update': {'slug': tag_slug}}
        )
        tag_connect_ops.append({'id': tag.id})

    await db.page.upsert(
        where={'confluenceId': confluence_id},
        data={
            'create': {
                'confluenceId': confluence_id, 'parentConfluenceId': parent_confluence_id,
                'title': title, 'slug': slug, 'description': description,
                'pageType': page_type, 'authorName': author_name, 'updatedAt': updated_at_str,
                'tags': { 'connect': tag_connect_ops }
            },
            'update': {
                'parentConfluenceId': parent_confluence_id, 'title': title, 'slug': slug,
                'description': description, 'pageType': page_type, 'authorName': author_name,
                'updatedAt': updated_at_str, 'tags': { 'set': tag_connect_ops }
            }
        }
    )

# Monkey-patch the method onto the PageRepository instance for this script run
from app.services.page_repository import PageRepository
PageRepository.create_or_update_page = create_or_update_page


if __name__ == "__main__":
    asyncio.run(main())