# server/cleanup_orphans.py
import asyncio
from app.db import db

async def main():
    """
    This script finds and deletes orphaned pages from the local database.
    An orphan is a page whose `parentConfluenceId` points to a page that no longer exists.
    """
    print("--- Starting Orphaned Page Cleanup Script ---")
    await db.connect()

    try:
        # 1. Fetch all pages from the database to work with them in memory.
        all_pages = await db.page.find_many()
        if not all_pages:
            print("Database is empty. No cleanup needed.")
            return

        # 2. Create a set of all existing Confluence IDs for very fast lookups.
        #    Checking `id in my_set` is much faster than querying the DB in a loop.
        existing_confluence_ids = {page.confluenceId for page in all_pages}
        print(f"Found {len(all_pages)} total pages in the database.")

        # 3. Identify which pages are orphans.
        orphaned_ids = []
        for page in all_pages:
            # An orphan is a page that has a parent ID, but that parent ID does not exist in our set of valid IDs.
            if page.parentConfluenceId and page.parentConfluenceId not in existing_confluence_ids:
                orphaned_ids.append(page.confluenceId)

        # 4. If we found any orphans, proceed with deletion.
        if not orphaned_ids:
            print("✅ No orphaned pages found. Your database is clean!")
        else:
            print(f"Found {len(orphaned_ids)} orphaned pages to delete.")
            print("Orphaned Page IDs:", orphaned_ids)

            # First, we must delete the associated ArticleSubmission records.
            # If we don't, the database will throw an error because of the foreign key constraint.
            print("Deleting associated submission records...")
            deleted_submissions_count = await db.articlesubmission.delete_many(
                where={'confluencePageId': {'in': orphaned_ids}}
            )
            # The result of delete_many is a count object, so we access its `count` attribute.
            print(f"Deleted {deleted_submissions_count} submission records.")

            # Now, we can safely delete the orphaned Page records themselves.
            print("Deleting orphaned page records...")
            deleted_pages_count = await db.page.delete_many(
                where={'confluenceId': {'in': orphaned_ids}}
            )
            print(f"✅ Successfully deleted {deleted_pages_count} orphaned page records.")

    except Exception as e:
        print(f"\nAn error occurred during cleanup: {e}")
        print("Please check your database connection and try again.")
    finally:
        await db.disconnect()
        print("--- Cleanup Script Finished ---")

if __name__ == "__main__":
    asyncio.run(main())