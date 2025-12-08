# server/app/services/notification_service.py
import asyncio
import json
from datetime import datetime, timedelta, timezone
from typing import List

from app.db import db
from app.broadcaster import broadcast
from app.services.page_repository import PageRepository

class NotificationService:
    """
    Handles all logic related to creating and sending notifications.
    This includes creating database records and pushing real-time broadcasts.
    """
    
    def __init__(self):
        # We can use the global db and broadcast instances
        self.db = db
        self.broadcast = broadcast
        self.page_repo = PageRepository()

    def _create_notification_payload(self, message: str, link: str) -> str:
        """Helper to create a consistent JSON payload for broadcasting."""
        return json.dumps({
            "message": message,
            "link": link
        })

    async def _get_global_admin_ids(self) -> List[int]:
        """Fetches all global admin user IDs."""
        admins = await self.db.user.find_many(where={'role': 'ADMIN'})
        return [admin.id for admin in admins]

    async def _get_group_admin_ids(self, page_confluence_id: str) -> List[int]:
        """Fetches IDs of users who are Group Admins for the given page hierarchy."""
        if not page_confluence_id:
            return []
            
        page = await self.page_repo.get_page_by_id(page_confluence_id)
        if not page:
            return []

        # Get IDs of this page and all its ancestors
        ancestor_ids = await self.page_repo.get_ancestor_db_ids(page)
        # We check if the group manages the page itself OR any ancestor
        relevant_db_ids = ancestor_ids + [page.id]

        group_members = await self.db.groupmember.find_many(
            where={
                'role': 'ADMIN',
                'group': {
                    'managedPageId': {'in': relevant_db_ids}
                }
            }
        )
        return [gm.userId for gm in group_members]

    async def _notify_user(self, user_id: int, message: str, link: str):
        """Creates a DB notification and pushes a broadcast to a single user."""
        try:
            await self.db.notification.create(data={
                'message': message,
                'link': link,
                'recipientId': user_id
            })
            payload = self._create_notification_payload(message, link)
            await self.broadcast.push(user_id, payload)
        except Exception as e:
            print(f"Error notifying user {user_id}: {e}")

    async def _notify_relevant_admins(self, message: str, link: str, page_id: str = None):
        """
        Creates DB notifications and broadcasts.
        Recipients = (All Global Admins) + (Group Admins who manage this specific page/hierarchy).
        """
        try:
            # 1. Always notify Global Admins
            recipient_ids = set(await self._get_global_admin_ids())

            # 2. If a page context is provided, find Group Admins responsible for it
            if page_id:
                group_admin_ids = await self._get_group_admin_ids(page_id)
                # Add them to the set (set handles duplicates if a user is both)
                recipient_ids.update(group_admin_ids)
            
            if not recipient_ids:
                return

            payload = self._create_notification_payload(message, link)
            
            # Create DB records for all unique recipients
            notifications_to_create = [
                {'message': message, 'link': link, 'recipientId': uid}
                for uid in recipient_ids
            ]
            await self.db.notification.create_many(data=notifications_to_create)

            # Push broadcast to all unique recipients
            for uid in recipient_ids:
                await self.broadcast.push(uid, payload)
        except Exception as e:
            print(f"Error notifying admins: {e}")

    # --- Public API ---

    async def notify_admins_of_submission(self, title: str, author_name: str, page_id: str = None):
        """Notifies admins of a new article submission."""
        message = f"New article '{title}' submitted by {author_name} is pending review."
        link = "/admin/dashboard"
        await self._notify_relevant_admins(message, link, page_id)

    async def notify_author_of_approval(self, author_id: int, title: str, page_id: str):
        """Notifies an author that their article was approved."""
        message = f"Your article '{title}' has been approved and published."
        link = f"/article/{page_id}"
        await self._notify_user(author_id, message, link)

    async def notify_author_of_rejection(self, author_id: int, title: str):
        """Notifies an author that their article was rejected."""
        message = f"Your article '{title}' was rejected. See comments for feedback."
        link = "/my-submissions"
        await self._notify_user(author_id, message, link)

    async def notify_admins_of_resubmission(self, title: str, author_name: str, page_id: str = None):
        """Notifies admins of an article resubmission."""
        message = f"Article '{title}' was resubmitted by {author_name} and is pending review."
        link = "/admin/dashboard"
        await self._notify_relevant_admins(message, link, page_id)

    async def run_cleanup_task(self):
        """
        A background task that runs every hour to delete old notifications.
        This is intended to be run as an asyncio task from main.py.
        """
        while True:
            try:
                # Wait for 1 hour
                await asyncio.sleep(3600) 
                
                print(f"[{datetime.now()}] Running notification cleanup task...")
                twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
                
                deleted_count = await self.db.notification.delete_many(
                    where={
                        'createdAt': {
                            'lt': twenty_four_hours_ago
                        }
                    }
                )
                if deleted_count > 0:
                    print(f"Cleaned up {deleted_count} old notifications.")
                else:
                    print("No old notifications to clean up.")
                    
            except Exception as e:
                # Catch exceptions so the loop doesn't break
                print(f"Error during notification cleanup: {e}")