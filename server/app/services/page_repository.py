# server/app/services/page_repository.py
from datetime import datetime
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup 

from app.db import db
from app.schemas.content_schemas import Tag, Article, Subsection, Ancestor, PageTreeNode, PageTreeNodeWithPermission
from app.schemas.cms_schemas import ArticleSubmissionStatus
from prisma.enums import PageType
from prisma.models import Page as PageModel, User
from prisma.types import PageInclude

class PageRepository:
    """
    Handles all database operations related to the Page and Tag models.
    """
    
    def __init__(self):
        self.db = db
        self._page_include: PageInclude = {'tags': True}
        self._public_facing_filter = {
            'OR': [
                {
                    'submission': {
                        'is': {
                            'status': ArticleSubmissionStatus.PUBLISHED
                        }
                    }
                },
                {
                    'submission': {
                        'is': None
                    }
                }
            ]
        }

    def _slugify(self, text: str) -> str:
        """Internal slugify, as this repo doesn't import from Confluence service."""
        import re
        text = text.lower()
        text = re.sub(r'[\s_&]+', '-', text)
        text = re.sub(r'[^\w\s-]', '', text)
        return text

    def _get_plain_text(self, html: str) -> str:
        """Helper to extract plain text from HTML."""
        if not html: return ""
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text(" ", strip=True)

    # --- THIS IS THE MISSING FUNCTION ---
    async def get_all_managed_and_descendant_ids(self, user: User) -> set[int]:
        """
        For a given user, finds all pages managed by their groups and all
        descendant pages of those managed pages, returning a set of their DB IDs.
        """
        if user.role == 'ADMIN':
            # Admins can edit everything, so we don't need to run a complex query.
            # Returning an empty set and checking for the admin role in the service is cleaner.
            return set()

        user_with_groups = await self.db.user.find_unique(
            where={'id': user.id},
            include={'groupMemberships': {'include': {'group': {'include': {'managedPage': True}}}}}
        )

        if not user_with_groups or not user_with_groups.groupMemberships:
            return set()

        # Get the initial DB IDs of the root pages managed by the user's groups
        root_managed_page_ids = [
            membership.group.managedPage.id 
            for membership in user_with_groups.groupMemberships 
            if membership.group.managedPage
        ]

        if not root_managed_page_ids:
            return set()

        # Use a recursive raw SQL query (Common Table Expression) to find all descendants.
        # This is far more efficient than looping in Python.
        query = f"""
        WITH RECURSIVE descendants AS (
            SELECT id, "confluenceId" FROM "Page" WHERE id IN ({','.join(map(str, root_managed_page_ids))})
            UNION ALL
            SELECT p.id, p."confluenceId" FROM "Page" p
            INNER JOIN descendants d ON p."parentConfluenceId" = d."confluenceId"
        )
        SELECT id FROM descendants;
        """
        
        results = await self.db.query_raw(query)
        
        return {item['id'] for item in results}
    # --- END OF THE MISSING FUNCTION ---

    async def _format_page_as_article(self, page: PageModel, group_slug: str, subsection_slug: str) -> Article:
        """Formats a Prisma Page model into an Article schema."""
        return Article(
            type='article',
            id=page.confluenceId,
            slug=page.slug,
            title=page.title,
            excerpt=page.description,
            description=page.description,
            html="", # HTML is not stored in the DB
            tags=[Tag.model_validate(t.model_dump()) for t in page.tags],
            group=group_slug,
            subsection=subsection_slug,
            updatedAt=page.updatedAt.isoformat(),
            views=page.views,
            readMinutes=1, # Read minutes is calculated dynamically from live content
            author=page.authorName
        )

    async def _format_page_as_subsection(self, page: PageModel, group_slug: str, html_content: str = "") -> Subsection:
        """Formats a Prisma Page model into a Subsection schema."""
        article_count = await self.db.page.count(
            where={
                'AND': [
                    {'parentConfluenceId': page.confluenceId},
                    self._public_facing_filter
                ]
            }
        )
        
        return Subsection(
            type='subsection',
            id=page.confluenceId,
            slug=page.slug,
            title=page.title,
            description=page.description,
            html=html_content, # HTML is only added when fetching a single page
            group=group_slug,
            tags=[Tag.model_validate(t.model_dump()) for t in page.tags],
            articleCount=article_count,
            updatedAt=page.updatedAt.isoformat()
        )
        
    
    async def get_page_by_id(self, confluence_id: str) -> Optional[PageModel]:
        """
        INTERNAL USE: Fetches a single Page by its Confluence ID without any
        visibility filters.
        """
        return await self.db.page.find_unique(
            where={'confluenceId': confluence_id},
            include=self._page_include
        )

    async def get_public_page_by_id(self, confluence_id: str) -> Optional[PageModel]:
        """Fetches a single Page by its Confluence ID, ensuring it is public."""
        return await self.db.page.find_first( # Use find_first to apply multiple filters
            where={
                'AND': [
                    {'confluenceId': confluence_id},
                    self._public_facing_filter
                ]
            },
            include=self._page_include
        )

    async def get_pages_by_ids(self, confluence_ids: List[str]) -> List[PageModel]:
        """Fetches a list of Pages matching the given Confluence IDs."""
        return await self.db.page.find_many(
            where={'confluenceId': {'in': confluence_ids}},
            include=self._page_include
        )

    async def get_subsections_by_parent_id(self, parent_confluence_id: str, group_slug: str) -> List[Subsection]:
        """Fetches child pages of a specific parent and formats them as Subsections."""
        child_pages = await self.db.page.find_many(
            where={
                'parentConfluenceId': parent_confluence_id,
                'pageType': PageType.SUBSECTION
            },
            include=self._page_include,
            order={'title': 'asc'}
        )
        
        subsections = []
        for page in child_pages:
            subsections.append(await self._format_page_as_subsection(page, group_slug, ""))
        return subsections

    async def get_paginated_children(
        self, parent_confluence_id: str, page: int, page_size: int, group_slug: str
    ) -> dict:
        skip = (page - 1) * page_size
        
        # Combine the existing filter with our new public-facing filter
        where_clause = {
            'AND': [
                {'parentConfluenceId': parent_confluence_id},
                self._public_facing_filter
            ]
        }

        child_pages = await self.db.page.find_many(
            where=where_clause, # Use the combined clause
            include=self._page_include,
            skip=skip,
            take=page_size,
            order=[
                {'pageType': 'asc'}, 
                {'title': 'asc'}
            ]
        )
        
        total_items = await self.db.page.count(where=where_clause)
        
        formatted_items = []
        parent_page = await self.db.page.find_unique(where={'confluenceId': parent_confluence_id})
        parent_slug = parent_page.slug if parent_page else "unknown"
        
        for item in child_pages:
            if item.pageType == PageType.SUBSECTION:
                formatted_items.append(await self._format_page_as_subsection(item, group_slug, ""))
            else: # It's an ARTICLE
                formatted_items.append(await self._format_page_as_article(item, group_slug, parent_slug))

        return {
            "items": formatted_items,
            "total": total_items,
            "page": page,
            "pageSize": page_size,
            "hasNext": (skip + len(child_pages)) < total_items
        }
        
    async def get_child_article_count(self, parent_confluence_id: str) -> int:
        """Counts only the direct ARTICLE children of a parent."""
        return await self.db.page.count(
            where={
                'parentConfluenceId': parent_confluence_id,
                'pageType': PageType.ARTICLE
            }
        )

    async def get_ancestors_from_db(self, page: PageModel) -> List[Ancestor]:
        """Recursively fetches all ancestors for a given page from the DB."""
        ancestors = []
        current_page = page
        while current_page and current_page.parentConfluenceId:
            parent = await self.db.page.find_unique(
                where={'confluenceId': current_page.parentConfluenceId}
            )
            
            if parent:
                ancestors.append(Ancestor(id=parent.confluenceId, title=parent.title, slug=parent.slug))
                current_page = parent
            else:
                break
        ancestors.reverse()
        return ancestors

    async def get_recent_articles(self, limit: int = 6) -> List[Article]:
        """Fetches the most recently updated articles."""
        pages = await self.db.page.find_many(
            where={
                'AND': [
                    {'pageType': PageType.ARTICLE},
                    self._public_facing_filter
                ]
            },
            include=self._page_include,
            order={'updatedAt': 'desc'},
            take=limit
        )
        # Note: Group/subsection slugs will be 'unknown' here, which is fine for cards
        return [await self._format_page_as_article(p, "unknown", "unknown") for p in pages]

    async def get_popular_articles(self, limit: int = 6) -> List[Article]:
        """Fetches the most viewed articles."""
        pages = await self.db.page.find_many(
            where={
                'AND': [
                    {'pageType': PageType.ARTICLE},
                    self._public_facing_filter
                ]
            },
            include=self._page_include,
            order={'views': 'desc'},
            take=limit
        )
        # Note: Group/subsection slugs will be 'unknown' here, which is fine for cards
        return [await self._format_page_as_article(p, "unknown", "unknown") for p in pages]

    async def get_all_tags(self) -> List[Tag]:
        """Fetches all unique tags from the database."""
        tags = await self.db.tag.find_many(order={'name': 'asc'})
        return [Tag.model_validate(t.model_dump()) for t in tags]

    async def get_ancestor_db_ids(self, page: PageModel) -> List[int]:
        """Recursively fetches all ancestor internal DB IDs for a given page."""
        ancestor_ids = []
        current_page = page
        while current_page and current_page.parentConfluenceId:
            parent = await self.db.page.find_unique(
                where={'confluenceId': current_page.parentConfluenceId}
            )
            if parent:
                ancestor_ids.append(parent.id)
                current_page = parent
            else:
                break
        return ancestor_ids

    async def create_page(
        self,
        confluence_id: str,
        title: str,
        slug: str,
        description: str,
        page_type: PageType,
        parent_confluence_id: str,
        author_name: str,
        updated_at_str: str,
        tag_names: List[str]
    ) -> PageModel:
        tag_connect_ops = []
        if tag_names:
            existing_tags = await self.db.tag.find_many(
                where={'name': {'in': tag_names}}
            )
            if len(existing_tags) != len(tag_names):
                found_names = {t.name for t in existing_tags}
                missing_names = set(tag_names) - found_names
                raise ValueError(f"The following tags do not exist and must be created by an admin first: {', '.join(missing_names)}")

            tag_connect_ops = [{'id': tag.id} for tag in existing_tags]
        
        return await self.db.page.create(data={
            'confluenceId': confluence_id,
            'title': title,
            'slug': slug,
            'description': description,
            'pageType': page_type,
            'parentConfluenceId': parent_confluence_id,
            'authorName': author_name,
            'updatedAt': updated_at_str,
            'tags': {'connect': tag_connect_ops}
        })

    async def update_page_metadata(
        self,
        confluence_id: str,
        title: str,
        slug: str,
        description: str,
        updated_at_str: str,
        parent_id: Optional[str] = None,
        tag_names: Optional[List[str]] = None
    ) -> PageModel:
        update_data = {
            'title': title,
            'slug': slug,
            'description': description,
            'updatedAt': updated_at_str,
            'parentConfluenceId': parent_id,
        }

        if tag_names is not None:
            tag_connect_ops = []
            if tag_names:
                # Find all existing tags in a single, efficient query.
                existing_tags = await self.db.tag.find_many(
                    where={'name': {'in': tag_names}}
                )

                # Validate that all provided tags exist.
                if len(existing_tags) != len(tag_names):
                    found_names = {t.name for t in existing_tags}
                    missing_names = set(tag_names) - found_names
                    raise ValueError(f"The following tags do not exist and must be created by an admin first: {', '.join(missing_names)}")
                
                tag_connect_ops = [{'id': tag.id} for tag in existing_tags]

            # Use 'set' to replace all existing tags with the new list.
            update_data['tags'] = {'set': tag_connect_ops}

        return await self.db.page.update(
            where={'confluenceId': confluence_id},
            data=update_data
        )

    async def sync_page_from_confluence_data(
        self, 
        confluence_id: str, 
        page_data: Dict[str, Any],
        page_type: PageType
    ) -> PageModel:
        # Find this function and replace its content with the following corrected version.
        
        title = page_data["title"]
        updated_at = page_data["version"]["when"]
        
        tag_ops = []
        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        
        slugs_from_confluence = [
            label["name"] for label in raw_labels if not label["name"].startswith("status-")
        ]

        if slugs_from_confluence:
            existing_tags = await self.db.tag.find_many(
                where={'slug': {'in': slugs_from_confluence}}
            )
            tag_ops = [{'id': tag.id} for tag in existing_tags]
        
        return await self.db.page.update(
            where={'confluenceId': confluence_id},
            data={
                'title': title,
                'slug': self._slugify(title),
                'pageType': page_type,
                'tags': {'set': tag_ops} 
            }
        )
    
    async def get_tree_nodes_by_parent_id(self, parent_id: Optional[str]) -> List[PageTreeNode]:
        nodes_to_return = []
        child_pages = await self.db.page.find_many(
            where={'parentConfluenceId': parent_id},
            order={'title': 'asc'}
        )
        for page in child_pages:
            child_count = await self.db.page.count(
                where={'parentConfluenceId': page.confluenceId}
            )
            nodes_to_return.append(
                PageTreeNode(
                    id=page.confluenceId,
                    title=page.title,
                    hasChildren=child_count > 0,
                    isAllowed=False # Default value, will be overridden by service
                )
            )
        return nodes_to_return
    
    async def get_child_pages_for_index(self, parent_id: Optional[str]) -> List[PageModel]:
        return await self.db.page.find_many(
            where={'parentConfluenceId': parent_id},
            order={'title': 'asc'}
        )

    async def has_children(self, page_id: str) -> bool:
        count = await self.db.page.count(
            where={'parentConfluenceId': page_id}
        )
        return count > 0
    
    async def delete_by_confluence_id(self, confluence_id: str) -> Optional[PageModel]:
        existing_page = await self.db.page.find_unique(where={'confluenceId': confluence_id})
        if existing_page:
            return await self.db.page.delete(where={'confluenceId': confluence_id})
        return None
    
    async def search_pages_for_index(self, search_term: str) -> List[PageModel]:
        return await self.db.page.find_many(
            where={
                'title': {
                    'contains': search_term,
                    'mode': 'insensitive'
                }
            },
            include=self._page_include,
            order={'title': 'asc'}
        )
    
    async def ensure_parent_is_subsection(self, parent_confluence_id: str):
        """
        Finds the parent page and updates its type to SUBSECTION if it's currently an ARTICLE.
        This is crucial when a new child is added to a page that was previously a leaf node.
        """
        parent_page = await self.db.page.find_unique(where={'confluenceId': parent_confluence_id})
        
        if parent_page and parent_page.pageType == PageType.ARTICLE:
            print(f"Updating parent page '{parent_page.title}' ({parent_confluence_id}) from ARTICLE to SUBSECTION.")
            await self.db.page.update(
                where={'confluenceId': parent_confluence_id},
                data={'pageType': PageType.SUBSECTION}
            )

    async def get_filtered_tree_nodes_for_user(self, user: User, parent_id: Optional[str]) -> List[PageTreeNodeWithPermission]:
        """
        Fetches a pruned page tree. It returns only nodes the user is allowed to edit
        and their direct ancestors. The 'isAllowed' flag is set to True only for the
        nodes that are actually editable.
        """
        # --- THIS IS THE FIX ---

        # 1. First, get the set of all database IDs for pages the user is TRULY allowed to edit.
        truly_allowed_db_ids = await self.get_all_managed_and_descendant_ids(user)
        if not truly_allowed_db_ids:
            return []

        # 2. This powerful query finds the set of all VISIBLE nodes:
        #    - All pages the user can edit.
        #    - All ancestors of those pages, so the user can see the path.
        query = f"""
        WITH RECURSIVE allowed_and_ancestors AS (
            SELECT id, "confluenceId", "parentConfluenceId" FROM "Page" WHERE id IN ({','.join(map(str, truly_allowed_db_ids))})
            UNION
            SELECT p.id, p."confluenceId", p."parentConfluenceId"
            FROM "Page" p
            INNER JOIN allowed_and_ancestors aa ON p."confluenceId" = aa."parentConfluenceId"
        )
        SELECT DISTINCT "confluenceId" FROM allowed_and_ancestors;
        """
        results = await self.db.query_raw(query)
        visible_confluence_ids = {item['confluenceId'] for item in results}

        if not visible_confluence_ids:
            return []
        
        # 3. Fetch the specific child pages for the current level of the tree that are in our visible set.
        child_pages = await self.db.page.find_many(
            where={
                'parentConfluenceId': parent_id,
                'confluenceId': {'in': list(visible_confluence_ids)}
            },
            order={'title': 'asc'}
        )
        
        # 4. Efficiently check which of these children have children themselves
        child_confluence_ids = [p.confluenceId for p in child_pages]
        parents_with_children_query = await self.db.page.find_many(
            where={'parentConfluenceId': {'in': child_confluence_ids}},
            distinct=['parentConfluenceId']
        )
        parent_ids_with_children_set = {p.parentConfluenceId for p in parents_with_children_query}

        # 5. Build the final response, now with correct permissions.
        nodes_to_return = []
        for page in child_pages:
            # The 'isAllowed' flag is now correctly determined by checking against our ground-truth set.
            is_node_allowed = page.id in truly_allowed_db_ids
            has_children = page.confluenceId in parent_ids_with_children_set
            
            nodes_to_return.append(
                PageTreeNodeWithPermission(
                    id=page.confluenceId,
                    title=page.title,
                    hasChildren=has_children,
                    isAllowed=is_node_allowed 
                )
            )
        return nodes_to_return