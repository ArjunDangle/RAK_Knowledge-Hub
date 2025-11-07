# server/one_time_import.py
import asyncio
from bs4 import BeautifulSoup
from typing import List, Dict, Optional, Set

# This allows the script to import from our app structure
from app.db import db
from app.services.confluence_service import ConfluenceService
from app.config import settings
from prisma.enums import PageType

# Instantiate the service to use its connection and helper methods
confluence_service = ConfluenceService(settings)

# --- NEW LOGIC: Function to get ALL page IDs from Confluence ---
async def get_all_confluence_page_ids_recursively(page_id: str, all_ids: Set[str]):
    """
    Recursively traverses all children of a page to build a complete set of all page IDs
    that currently exist in the Confluence space.
    """
    if page_id in all_ids:
        return
    all_ids.add(page_id)
    
    try:
        children = confluence_service.confluence_repo.get_child_pages(page_id)
        for child in children:
            await get_all_confluence_page_ids_recursively(child['id'], all_ids)
    except Exception as e:
        print(f"  -> WARN: Could not fetch children for page ID {page_id}. Reason: {e}")

# --- MODIFIED LOGIC: The core processing function is now smarter ---
async def process_page_and_children(page_id: str, parent_confluence_id: Optional[str] = None):
    """
    Recursively processes pages from Confluence.
    - If a page is new, it creates it in the database.
    - If a page exists, it checks if its parent has changed and updates only that.
    - It does NOT overwrite other metadata for existing pages.
    """
    # 1. Check if the page already exists in our DB
    existing_page = await db.page.find_unique(where={'confluenceId': page_id})

    if existing_page:
        # Page exists. The only thing we will update is its parent if it was moved.
        if existing_page.parentConfluenceId != parent_confluence_id:
            print(f"Updating parent for existing page: '{existing_page.title}'")
            await db.page.update(
                where={'confluenceId': page_id},
                data={'parentConfluenceId': parent_confluence_id}
            )
    else:
        # Page does NOT exist. We need to create it.
        print(f"Creating new page for ID: {page_id}...")
        try:
            # Fetch full page data from Confluence
            page_data = confluence_service.confluence_repo.get_page_by_id(
                page_id, expand="body.view,version,metadata.labels"
            )
            if not page_data:
                print(f"  -> WARN: Could not fetch data for new page ID {page_id}. Skipping.")
                return

            # Extract Metadata
            title = page_data["title"]
            author_name = page_data.get("version", {}).get("by", {}).get("displayName", "Unknown")
            updated_at = page_data["version"]["when"]
            html_content = page_data.get("body", {}).get("view", {}).get("value", "")
            plain_text = BeautifulSoup(html_content, 'html.parser').get_text(" ", strip=True)
            description = (plain_text[:250] + '...') if len(plain_text) > 250 else "No description available."

            # Determine Page Type
            children_for_type_check = confluence_service.confluence_repo.get_child_pages(page_id)
            page_type = PageType.SUBSECTION if children_for_type_check else PageType.ARTICLE
            
            # Use the PageRepository to create the page in our DB
            await confluence_service.page_repo.create_page(
                confluence_id=page_id,
                title=title,
                slug=confluence_service._slugify(title),
                description=description,
                page_type=page_type,
                parent_confluence_id=parent_confluence_id,
                author_name=author_name,
                updated_at_str=updated_at,
                tag_names=[
                    label['name'] for label in page_data.get("metadata", {}).get("labels", {}).get("results", [])
                    if not label['name'].startswith("status-")
                ]
            )
            print(f"  -> SUCCESS: Created page '{title}'")
        
        except Exception as e:
            print(f"  -> ERROR: Failed to create page ID {page_id}. Reason: {e}")

    # After processing the current page, recurse for its children from Confluence
    children_from_confluence = confluence_service.confluence_repo.get_child_pages(page_id)
    for child in children_from_confluence:
        await process_page_and_children(child['id'], parent_confluence_id=page_id)

# --- MODIFIED LOGIC: The main function now orchestrates all three phases ---
async def main():
    """
    Main function to run the incremental sync.
    1. Deletes pages from DB that are no longer in Confluence.
    2. Adds new pages to DB that were created in Confluence.
    3. Updates parent relationships for pages that were moved in Confluence.
    """
    print("--- Starting Confluence Incremental Sync ---")
    await db.connect()
    try:
        # --- PHASE 1: COLLECT ALL IDs ---
        print("\n[Phase 1/3] Collecting all page IDs from Confluence and Database...")
        
        # Get all live page IDs from Confluence by traversing the entire tree
        confluence_ids: Set[str] = set()
        root_page_ids = confluence_service.confluence_repo.root_page_ids
        for slug, page_id in root_page_ids.items():
            await get_all_confluence_page_ids_recursively(page_id, confluence_ids)
        print(f"Found {len(confluence_ids)} total pages in Confluence.")
        
        # Get all page IDs currently in our database
        db_pages = await db.page.find_many(select={'confluenceId': True})
        db_ids = {page.confluenceId for page in db_pages}
        print(f"Found {len(db_ids)} total pages in the database.")

        # --- PHASE 2: PRUNE DELETED PAGES ---
        print("\n[Phase 2/3] Checking for pages to delete...")
        ids_to_delete = db_ids - confluence_ids
        
        if ids_to_delete:
            print(f"Found {len(ids_to_delete)} pages to delete from the database.")
            
            # Important: Delete from the submission table first due to foreign key constraints
            await db.articlesubmission.delete_many(
                where={'confluencePageId': {'in': list(ids_to_delete)}}
            )
            
            # Now delete the pages themselves
            await db.page.delete_many(
                where={'confluenceId': {'in': list(ids_to_delete)}}
            )
            print("  -> SUCCESS: Deleted orphaned pages.")
        else:
            print("  -> No pages to delete. Database is clean.")

        # --- PHASE 3: ADD NEW/MOVED PAGES ---
        print("\n[Phase 3/3] Syncing new and moved pages...")
        for slug, page_id in root_page_ids.items():
            # The parent of the root pages is None.
            await process_page_and_children(page_id, parent_confluence_id=None)
        print("  -> SUCCESS: Finished syncing.")

    finally:
        await db.disconnect()
        print("\n--- Confluence Incremental Sync Finished ---")

# This part remains the same to run the script
if __name__ == "__main__":
    asyncio.run(main())