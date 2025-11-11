# server/one_time_import.py
import asyncio
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Set

from app.db import db
from app.services.confluence_service import ConfluenceService
from app.config import settings
from prisma.enums import PageType

confluence_service = ConfluenceService(settings)

async def get_all_confluence_page_ids_recursively(page_id: str, all_ids: Set[str]):
    if page_id in all_ids:
        return
    all_ids.add(page_id)
    try:
        children = confluence_service.confluence_repo.get_child_pages(page_id)
        for child in children:
            await get_all_confluence_page_ids_recursively(child['id'], all_ids)
    except Exception as e:
        print(f"  -> WARN: Could not fetch children for page ID {page_id}. Reason: {e}")

async def process_page_and_children(page_id: str, parent_confluence_id: Optional[str] = None):
    existing_page = await db.page.find_unique(where={'confluenceId': page_id})
    children_from_confluence = confluence_service.confluence_repo.get_child_pages(page_id)
    
    correct_page_type = PageType.SUBSECTION if children_from_confluence else PageType.ARTICLE

    if existing_page:
        if existing_page.parentConfluenceId != parent_confluence_id or existing_page.pageType != correct_page_type:
            print(f"Updating existing page: '{existing_page.title}' (Type: {correct_page_type.name})")
            await db.page.update(
                where={'confluenceId': page_id},
                data={
                    'parentConfluenceId': parent_confluence_id,
                    'pageType': correct_page_type 
                }
            )
    else:
        print(f"Creating new page for ID: {page_id}...")
        try:
            page_data = confluence_service.confluence_repo.get_page_by_id(
                page_id, expand="body.view,version,metadata.labels"
            )
            if not page_data:
                print(f"  -> WARN: Could not fetch data for new page ID {page_id}. Skipping.")
                return

            title = page_data["title"]
            author_name = page_data.get("version", {}).get("by", {}).get("displayName", "Unknown")
            updated_at = page_data["version"]["when"]
            html_content = page_data.get("body", {}).get("view", {}).get("value", "")
            plain_text = BeautifulSoup(html_content, 'html.parser').get_text(" ", strip=True)
            description = (plain_text[:250] + '...') 
            if plain_text:
                description = (plain_text[:250] + '...') if len(plain_text) > 250 else plain_text
            else:
                description = "No description available."

            await confluence_service.page_repo.create_page(
                confluence_id=page_id, title=title, slug=confluence_service._slugify(title),
                description=description, page_type=correct_page_type,
                parent_confluence_id=parent_confluence_id, author_name=author_name,
                updated_at_str=updated_at,
                tag_names=[
                    label['name'] for label in page_data.get("metadata", {}).get("labels", {}).get("results", [])
                    if not label['name'].startswith("status-")
                ]
            )
            print(f"  -> SUCCESS: Created page '{title}'")
        
        except Exception as e:
            print(f"  -> ERROR: Failed to create page ID {page_id}. Reason: {e}")

    for child in children_from_confluence:
        await process_page_and_children(child['id'], parent_confluence_id=page_id)

async def main():
    print("--- Starting Confluence Incremental Sync ---")
    await db.connect()
    try:
        print("\n[Phase 1/3] Collecting all page IDs...")
        confluence_ids: Set[str] = set()
        root_page_ids = confluence_service.confluence_repo.root_page_ids
        for slug, page_id in root_page_ids.items():
            await get_all_confluence_page_ids_recursively(page_id, confluence_ids)
        print(f"Found {len(confluence_ids)} total pages in Confluence.")
        
        # THIS IS THE FIX: Fetch the full objects, then extract the IDs.
        db_pages = await db.page.find_many()
        db_ids = {page.confluenceId for page in db_pages}
        print(f"Found {len(db_ids)} total pages in the database.")

        print("\n[Phase 2/3] Checking for pages to delete...")
        ids_to_delete = db_ids - confluence_ids
        
        if ids_to_delete:
            print(f"Found {len(ids_to_delete)} pages to delete.")
            await db.articlesubmission.delete_many(where={'confluencePageId': {'in': list(ids_to_delete)}})
            await db.page.delete_many(where={'confluenceId': {'in': list(ids_to_delete)}})
            print("  -> SUCCESS: Deleted orphaned pages.")
        else:
            print("  -> No pages to delete.")

        print("\n[Phase 3/3] Syncing new, moved, and type-changed pages...")
        for slug, page_id in root_page_ids.items():
            await process_page_and_children(page_id, parent_confluence_id=None)
        print("  -> SUCCESS: Finished syncing.")

    finally:
        await db.disconnect()
        print("\n--- Confluence Incremental Sync Finished ---")

if __name__ == "__main__":
    asyncio.run(main())