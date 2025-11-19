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

        # --- THIS IS THE FIX ---
        # The query now correctly includes the nested groupMemberships relation.
        user_with_memberships = await self.db.user.find_unique(
            where={'id': user.id},
            include={'groupMemberships': {'include': {'group': True}}}
        )
        # --- END OF FIX ---

        if not user_with_memberships or not user_with_memberships.groupMemberships:
            return False

        user_group_ids = {membership.group.id for membership in user_with_memberships.groupMemberships if membership.group}

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
        
        return managing_group is not None
    
    async def user_is_group_admin_for_page(self, page_confluence_id: str, user: User) -> bool:
        """
        Checks if a user has GROUP_ADMIN rights over a page.
        This is true if:
        1. The user is a member of a group with the 'GROUP_ADMIN' role.
        2. That group's managedPageId is either the page's ID or one of its ancestors' IDs.
        """
        # 1. Fetch user's GROUP_ADMIN memberships, including the group and its managed page.
        user_with_memberships = await self.db.user.find_unique(
            where={'id': user.id},
            include={
                'groupMemberships': {
                    'where': {'role': 'GROUP_ADMIN'},
                    'include': {'group': True}
                }
            }
        )
        
        if not user_with_memberships or not user_with_memberships.groupMemberships:
            return False

        # 2. Get the DB IDs of the pages these groups manage.
        managed_page_db_ids = {
            membership.group.managedPageId 
            for membership in user_with_memberships.groupMemberships
            if membership.group and membership.group.managedPageId is not None
        }

        if not managed_page_db_ids:
            return False

        # 3. Get the page being checked and its ancestors.
        page_to_check = await self.page_repo.get_page_by_id(page_confluence_id)
        if not page_to_check:
            return False
        
        ancestor_db_ids = await self.page_repo.get_ancestor_db_ids(page_to_check)
        page_and_ancestor_db_ids = set(ancestor_db_ids + [page_to_check.id])

        # 4. Check for an intersection.
        # If any of the user's managed pages are in the page's hierarchy, they have permission.
        return not managed_page_db_ids.isdisjoint(page_and_ancestor_db_ids)