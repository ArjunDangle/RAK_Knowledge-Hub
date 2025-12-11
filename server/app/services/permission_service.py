# server/app/services/permission_service.py

from app.db import db
from app.services.page_repository import PageRepository
from prisma.models import User

class PermissionService:
    def __init__(self):
        self.db = db
        self.page_repo = PageRepository()

    async def user_has_edit_permission(self, page_confluence_id: str, user: User) -> bool:
        """
        Checks if a user has permission to edit a page.
        Permission is granted if:
        1. The user is an ADMIN.
        2. The user is a member of a group that manages this page or one of its ancestors.
        """
        # 1. Admins can edit anything
        if user.role == "ADMIN":
            return True

        # 2. Fetch the user's group memberships
        user_with_groups = await self.db.user.find_unique(
            where={'id': user.id},
            include={'groupMemberships': {'include': {'group': True}}}
        )
        if not user_with_groups or not user_with_groups.groupMemberships:
            return False

        user_group_ids = {m.group.id for m in user_with_groups.groupMemberships}

        # 3. Get the page being edited
        page_to_edit = await self.page_repo.get_page_by_id(page_confluence_id)
        if not page_to_edit:
            return False
            
        # 4. Get the page's ancestor chain
        ancestor_db_ids = await self.page_repo.get_ancestor_db_ids(page_to_edit)
        page_and_ancestor_db_ids = ancestor_db_ids + [page_to_edit.id]

        # 5. Check if any page in this hierarchy is managed by one of the user's groups
        managing_group = await self.db.group.find_first(
            where={
                'managedPageId': {'in': page_and_ancestor_db_ids},
                'id': {'in': list(user_group_ids)}
            }
        )
        
        if managing_group:
            return True
        else:
            return False
    
    async def user_is_group_admin_of_page(self, page_confluence_id: str, user_id: int) -> bool:
        """
        Checks if the user is a Group Admin of the group managing this specific page.
        """
        # 1. Get the page being acted upon
        page = await self.page_repo.get_page_by_id(page_confluence_id)
        if not page:
            return False
            
        # 2. Get the page's ancestor chain to find the root managed page
        ancestor_db_ids = await self.page_repo.get_ancestor_db_ids(page)
        page_and_ancestor_db_ids = ancestor_db_ids + [page.id]

        # 3. Check if the user has an 'ADMIN' role in a group managing this hierarchy
        membership = await self.db.groupmember.find_first(
            where={
                'userId': user_id,
                'role': 'ADMIN', # <--- Crucial check
                'group': {
                    'managedPageId': {'in': page_and_ancestor_db_ids}
                }
            }
        )
        
        return membership is not None