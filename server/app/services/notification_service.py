# server/app/services/notification_service.py
import asyncio
import json
from datetime import datetime, timedelta, timezone
from typing import List

from app.db import db
from app.broadcaster import broadcast

class NotificationService:
    """
    Handles all logic related to creating and sending notifications.
    This includes creating database records and pushing real-time broadcasts.
    """
    
    def __init__(self):
        # We can use the global db and broadcast instances
        self.db = db
        self.broadcast = broadcast

    def _create_notification_payload(self, message: str, link: str) -> str:
        """Helper to create a consistent JSON payload for broadcasting."""
        return json.dumps({
            "message": message,
            "link": link
        })

    async def _get_admin_ids(self) -> List[int]:
        """Fetches all admin user IDs."""
        admins = await self.db.user.find_many(where={'role': 'ADMIN'}, select={'id': True})
        return [admin.id for admin in admins]

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

    async def _notify_all_admins(self, message: str, link: str):
        """Creates DB notifications and broadcasts to all admins."""
        try:
            admin_ids = await self._get_admin_ids()
            if not admin_ids:
                return

            payload = self._create_notification_payload(message, link)
            
            # Create DB records for all admins
            notifications_to_create = [
                {'message': message, 'link': link, 'recipientId': admin_id}
                for admin_id in admin_ids
            ]
            await self.db.notification.create_many(data=notifications_to_create)

            # Push broadcast to all admins
            for admin_id in admin_ids:
                await self.broadcast.push(admin_id, payload)
        except Exception as e:
            print(f"Error notifying all admins: {e}")

    # --- Public API ---

    async def notify_admins_of_submission(self, title: str, author_name: str):
        """Notifies all admins of a new article submission."""
        message = f"New article '{title}' submitted by {author_name} is pending review."
        link = "/admin/dashboard"
        await self._notify_all_admins(message, link)

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

    async def notify_admins_of_resubmission(self, title: str, author_name: str):
        """Notifies all admins of an article resubmission."""
        message = f"Article '{title}' was resubmitted by {author_name} and is pending review."
        link = "/admin/dashboard"
        await self._notify_all_admins(message, link)

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
