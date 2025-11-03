# server/one_time_import.py
import asyncio
from bs4 import BeautifulSoup
import re
from typing import List, Dict

# This allows the script to import from our app structure
from app.db import db
from app.services.confluence_service import ConfluenceService
from app.config import settings
from prisma.models import Page
from prisma.enums import PageType

# Instantiate the Confluence service to use its connection and helper methods
confluence_service = ConfluenceService(settings)

async def process_page_and_children(page_id: str, parent_confluence_id: str = None):
    """
    Recursively fetches a Confluence page, saves its metadata to the local DB,
    and then does the same for all of its children.

    Args:
        page_id (str): The Confluence ID of the page to process.
        parent_confluence_id (str, optional): The Confluence ID of this page's parent. Defaults to None.
    """
    print(f"Processing page ID: {page_id}...")
    try:
        # 1. Fetch the full page data from Confluence
        # We need a comprehensive view of the page to extract all metadata.
        page_data = confluence_service.confluence.get_page_by_id(
            page_id, expand="body.view,version,metadata.labels"
        )
        if not page_data:
            print(f"  -> WARN: Could not fetch page data for ID {page_id}. Skipping.")
            return

        # 2. Extract Metadata from the Confluence response
        title = page_data["title"]
        author_name = page_data.get("version", {}).get("by", {}).get("displayName", "Unknown")
        updated_at = page_data["version"]["when"]
        
        # 3. Auto-generate the description as per the plan
        html_content = page_data.get("body", {}).get("view", {}).get("value", "")
        plain_text = BeautifulSoup(html_content, 'html.parser').get_text(" ", strip=True)
        description = (plain_text[:250] + '...') if len(plain_text) > 250 else plain_text
        if not description:
            description = "No description available."

        # 4. Determine Page Type (SUBSECTION or ARTICLE)
        # We check if the page has any children. If yes, it's a SUBSECTION.
        child_pages_response = confluence_service.confluence.get_child_pages(page_id)
        children = list(child_pages_response)
        page_type = PageType.SUBSECTION if children else PageType.ARTICLE

        # 5. Process Tags (Labels)
        tag_connect_ops = []
        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        for label in raw_labels:
            tag_name = label["name"]
            # We don't want to import internal status labels as tags
            if tag_name.startswith("status-"):
                continue
            
            slug = confluence_service._slugify(tag_name)
            # Use upsert to create the tag if it doesn't exist, or do nothing if it does.
            # This is efficient and prevents duplicates.
            tag = await db.tag.upsert(
                where={'name': tag_name},
                data={
                    'create': {'name': tag_name, 'slug': slug},
                    'update': {'slug': slug}
                }
            )
            tag_connect_ops.append({'id': tag.id})

        # 6. Save the Page to our local database
        # We use upsert here as well. This makes the script safe to re-run.
        # It will update existing entries instead of crashing.
        await db.page.upsert(
            where={'confluenceId': page_id},
            data={
                'create': {
                    'confluenceId': page_id,
                    'parentConfluenceId': parent_confluence_id,
                    'title': title,
                    'slug': confluence_service._slugify(title),
                    'description': description,
                    'pageType': page_type,
                    'authorName': author_name,
                    'updatedAt': updated_at,
                    'tags': { 'connect': tag_connect_ops }
                },
                'update': {
                    'parentConfluenceId': parent_confluence_id,
                    'title': title,
                    'slug': confluence_service._slugify(title),
                    'description': description,
                    'pageType': page_type,
                    'authorName': author_name,
                    'updatedAt': updated_at,
                    'tags': { 'set': tag_connect_ops } # 'set' replaces all existing tags with the new list
                }
            }
        )
        print(f"  -> SUCCESS: Synced page '{title}'")

        # 7. Recurse for all children
        # If this page has children, we call this same function for each of them.
        for child in children:
            await process_page_and_children(child['id'], parent_confluence_id=page_id)

    except Exception as e:
        print(f"  -> ERROR: Failed to process page ID {page_id}. Reason: {e}")


async def main():
    """
    Main function to start the import process.
    It connects to the database, finds the root pages, and starts the recursive sync.
    """
    print("--- Starting Confluence Data Import ---")
    await db.connect()
    try:
        # Get the IDs of our main entry points ("Departments", "Tools", etc.)
        root_page_ids = confluence_service._discover_root_pages()
        if not root_page_ids:
            print("CRITICAL: No root pages found in Confluence. Aborting sync.")
            return
            
        print(f"Found root pages: {list(root_page_ids.keys())}")

        # Start the recursive process for each root page.
        # We need the space's ID as the parent for these root pages.
        space_info = confluence_service.confluence.get_space(settings.confluence_space_key)
        space_id = space_info.get("id")

        for slug, page_id in root_page_ids.items():
            # The parent of our root pages is the space itself.
            # While Confluence doesn't model this directly, we can use the space ID for consistency if needed,
            # but for our logic, None is sufficient as they are the top level.
            await process_page_and_children(page_id, parent_confluence_id=None)

    finally:
        await db.disconnect()
        print("--- Confluence Data Import Finished ---")


if __name__ == "__main__":
    # This allows us to run the script from the command line.
    asyncio.run(main())