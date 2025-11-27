# server/app/services/confluence_service.py
import re
from typing import List, Dict, Optional, Any, Union
from bs4 import BeautifulSoup
from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse

from app.db import db
from app.config import Settings
from app.schemas.content_schemas import Article, Tag, Subsection, GroupInfo, PageContentItem, Ancestor, PageTreeNode, PageTreeNodeWithPermission
from app.schemas.cms_schemas import PageCreate, PageUpdate, ContentNode, PageDetailResponse
from app.schemas.cms_schemas import ArticleSubmissionStatus
from app.schemas.auth_schemas import UserResponse
from app.utils.html_translator import html_to_storage_format
from prisma.enums import PageType

# Import Repositories and Services
from app.services.confluence_repository import ConfluenceRepository, ROOT_PAGE_CONFIG
from app.services.page_repository import PageRepository
from app.services.submission_repository import SubmissionRepository
from app.services.notification_service import NotificationService

class ConfluenceService:
    """
    Acts as an orchestrator, coordinating repositories and other services
    to fulfill business logic requirements.
    """
    
    def __init__(self, settings: Settings):
        self.settings = settings
        
        # Initialize all dependencies
        self.confluence_repo = ConfluenceRepository(settings)
        self.page_repo = PageRepository()
        self.submission_repo = SubmissionRepository()
        self.notification_service = NotificationService()
        self.db = db

        # Get startup data from the Confluence repository
        self.root_page_ids = self.confluence_repo.root_page_ids
        self.id_to_group_slug_map = self.confluence_repo.id_to_group_slug_map

    # --- Utility & Transformation Methods ---

    def _slugify(self, text: str) -> str:
        """Creates a URL-friendly slug from text."""
        text = text.lower()
        text = re.sub(r'[\s_&]+', '-', text)
        text = re.sub(r'[^\w\s-]', '', text)
        return text

    def _get_plain_text(self, html_content: str) -> str:
        """Strips all HTML tags to get plain text."""
        if not html_content: return ""
        soup = BeautifulSoup(html_content, 'html.parser')
        return soup.get_text(" ", strip=True)
        
    def _get_group_from_ancestors(self, ancestors: List[Union[Ancestor, Dict[str, Any]]]) -> str:
        """
        Finds the root-level group from an ancestor list.
        Handles both Pydantic 'Ancestor' objects (from DB) and dicts (from Confluence API).
        """
        for ancestor in ancestors:
            ancestor_id = ancestor['id'] if isinstance(ancestor, dict) else ancestor.id
            if ancestor_id in self.id_to_group_slug_map:
                return self.id_to_group_slug_map[ancestor_id]
        return "unknown" # Fallback

    async def _transform_raw_page_to_article(self, page_data: dict, is_admin_view: bool = False) -> Optional[Article]:
        """
        Transforms a raw Confluence page dictionary into an Article schema.
        """
        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        label_names = {label.get("name") for label in raw_labels}
        
        if not is_admin_view:
            if "status-unpublished" in label_names or "status-rejected" in label_names:
                return None

        ancestors = page_data.get('ancestors', [])
        if not ancestors:
            return None

        group_slug = self._get_group_from_ancestors(ancestors)
        if not group_slug:
            return None
        
        subsection_slug = self._slugify(ancestors[-1]['title']) if ancestors else ""
        
        html_content = page_data.get("body", {}).get("view", {}).get("value", "")
        plain_text = self._get_plain_text(html_content)
        word_count = len(plain_text.split())
        read_minutes = max(1, round(word_count / 200))
        excerpt = (plain_text[:150] + '...') if len(plain_text) > 150 else plain_text
        
        status_labels = {"status-unpublished", "status-rejected"}
        tags = [
            Tag.model_validate(t.model_dump())
            for label in raw_labels if label.get("name") not in status_labels
            for t in [self.confluence_repo.get_tag_by_name(label["name"])] if t
        ]
       
        author_info = page_data.get("version", {}).get("by", {})
        author_name = author_info.get("displayName") if author_info else "Unknown"
        
        article_data = {
            "id": page_data["id"],
            "slug": self._slugify(page_data["title"]),
            "title": page_data["title"],
            "excerpt": excerpt,
            "description": excerpt,
            "html": html_content,
            "tags": tags,
            "group": group_slug,
            "subsection": subsection_slug,
            "updatedAt": page_data["version"]["when"],
            "views": 0,
            "readMinutes": read_minutes,
            "author": author_name,
            "parentId": ancestors[-1]['id'] if ancestors else None
        }
        return Article.model_validate(article_data)

    # --- Knowledge Hub Read Endpoints (Orchestration) ---

    def get_groups(self) -> List[GroupInfo]:
        """Dynamically returns group info based on the centralized config."""
        # --- MODIFIED LOGIC ---
        groups = []
        for config in ROOT_PAGE_CONFIG:
            # Check if the root page was successfully discovered at startup
            if config["slug"] in self.root_page_ids:
                groups.append(GroupInfo(
                    id=config["slug"],
                    title=config["display_title"],
                    description=config["description"],
                    icon=config["icon"]
                ))
        return groups

    async def get_subsections_by_group(self, group_slug: str) -> List[Subsection]:
        """
        Fetches top-level subsections for a group (e.g., 'departments')
        by querying the local database via the PageRepository.
        """
        root_page_id = self.root_page_ids.get(group_slug)
        if not root_page_id:
            raise HTTPException(status_code=404, detail=f"Group with slug '{group_slug}' not found.")
        
        return await self.page_repo.get_subsections_by_parent_id(root_page_id, group_slug)

    async def get_page_contents_from_db(self, parent_confluence_id: str, page: int, page_size: int) -> dict:
        """
        Fetches paginated contents (children) of a given parent page
        directly from the local database via the PageRepository.
        """
        try:
            parent_page = await self.page_repo.get_page_by_id(parent_confluence_id)
            if not parent_page:
                raise HTTPException(status_code=404, detail="Parent page not found")
                
            ancestors = await self.page_repo.get_ancestors_from_db(parent_page)
            group_slug = self._get_group_from_ancestors(ancestors)
            
            return await self.page_repo.get_paginated_children(
                parent_confluence_id=parent_confluence_id,
                page=page,
                page_size=page_size,
                group_slug=group_slug
            )
        except HTTPException as e:
            raise e
        except Exception as e:
            print(f"Error in get_page_contents router: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch page contents.")

    async def get_article_by_id_hybrid(self, page_id: str, user: Optional[UserResponse] = None) -> Optional[Article]:
        page_metadata = await self.db.page.find_unique(where={'confluenceId': page_id}, include={'tags': True, 'submission': True})
        if not page_metadata or page_metadata.pageType != PageType.ARTICLE: return None

        is_published = not page_metadata.submission or page_metadata.submission.status == ArticleSubmissionStatus.PUBLISHED
        is_global_admin = user and user.role == 'ADMIN'
        is_author = user and page_metadata.submission and user.id == page_metadata.submission.authorId

        # --- NEW LOGIC: Check for Group Admin permissions ---
        is_group_admin = False
        if user and not is_global_admin:
            # 1. Collect IDs of pages managed by groups where this user is an ADMIN
            managed_page_ids = set()
            if user.groupMemberships:
                for m in user.groupMemberships:
                    if m.role == 'ADMIN' and m.group and m.group.managedPage:
                        managed_page_ids.add(m.group.managedPage.id)
            
            if managed_page_ids:
                # 2. Get the hierarchy of the current page
                ancestor_db_ids = await self.page_repo.get_ancestor_db_ids(page_metadata)
                # Check if the page itself or any ancestor is managed by the user's admin groups
                page_hierarchy_ids = set(ancestor_db_ids)
                page_hierarchy_ids.add(page_metadata.id)
                
                if not managed_page_ids.isdisjoint(page_hierarchy_ids):
                    is_group_admin = True
        # -----------------------------------------------------

        if not is_published and not is_global_admin and not is_author and not is_group_admin: return None

        html_content = ""
        read_minutes = 1
        try:
            html_content = self.confluence_repo.get_page_content(page_id)
            plain_text = self._get_plain_text(html_content)
            word_count = len(plain_text.split())
            read_minutes = max(1, round(word_count / 200))
        except Exception as e:
            print(f"CRITICAL: Could not fetch content for page {page_id} from Confluence. Error: {e}")
            html_content = "<p>Error: Could not load document content from the source.</p>"
        
        ancestors = await self.page_repo.get_ancestors_from_db(page_metadata)
        group_slug = self._get_group_from_ancestors(ancestors)
        subsection_slug = ancestors[-1].title if ancestors else "unknown"

        return Article(
            type='article',
            id=page_metadata.confluenceId,
            slug=page_metadata.slug,
            title=page_metadata.title,
            excerpt=page_metadata.description,
            description=page_metadata.description,
            html=html_content,
            tags=[Tag.model_validate(t.model_dump()) for t in page_metadata.tags],
            group=group_slug,
            subsection=self._slugify(subsection_slug),
            updatedAt=page_metadata.updatedAt.isoformat(),
            views=page_metadata.views,
            readMinutes=read_minutes,
            author=page_metadata.authorName,
            parentId=page_metadata.parentConfluenceId,
            canEdit=is_global_admin or is_group_admin 
        )

    async def get_subsection_by_id_hybrid(self, page_id: str) -> Optional[Subsection]:
        """
        HYBRID FETCH: Fetches metadata from local DB (fast) and content
        from Confluence (slow) and merges them for a SUBSECTION.
        """
        
        # Step 1: Fetch metadata from DB
        page_metadata = await self.page_repo.get_public_page_by_id(confluence_id=page_id)
        if not page_metadata or page_metadata.pageType != PageType.SUBSECTION:
            return None # Not found or not a subsection

        # Step 2: Fetch live content from Confluence
        html_content = ""
        try:
            html_content = self.confluence_repo.get_page_content(page_id)
        except Exception as e:
            print(f"CRITICAL: Could not fetch content for page {page_id} from Confluence. Error: {e}")
            html_content = "<p>Error: Could not load document content from the source.</p>"
        
        # Step 3: Get ancestors to determine group slug
        ancestors = await self.page_repo.get_ancestors_from_db(page_metadata)
        group_slug = self._get_group_from_ancestors(ancestors)

        # Step 4: Merge and format into Subsection schema (includes child count)
        return await self.page_repo._format_page_as_subsection(
            page=page_metadata,
            group_slug=group_slug,
            html_content=html_content
        )

    async def get_ancestors(self, page_id: str) -> List[Ancestor]:
        """Gets ancestors from the local DB."""
        page = await self.page_repo.get_page_by_id(page_id)
        if not page:
            return []
        return await self.page_repo.get_ancestors_from_db(page)

    async def search_content_hybrid(self, query: str, mode: str, sort: str, page: int, page_size: int) -> dict:
        """
        DIRECT CONFLUENCE SEARCH: Searches Confluence and fetches full page details
        directly from the API, respecting the specified search mode and sort order.
        """
        import asyncio

        # 1. Build the Confluence Query Language (CQL) string based on the mode
        base_cql = f'space = "{self.settings.confluence_space_key}" and type = page and label != "status-unpublished" and label != "status-rejected"'
        
        sanitized_query = query.replace('"', '\\"')

        if mode == "title":
            specific_cql = f'title ~ "{sanitized_query}"'
        elif mode == "tags":
            # Split the query by commas, and clean up whitespace
            tag_names_from_query = [name.strip() for name in sanitized_query.strip().split(',') if name.strip()]
            
            if not tag_names_from_query:
                # If the query is empty after splitting, return no results
                return {"items": [], "total": 0, "page": 1, "pageSize": page_size, "hasNext": False}
            
            # Find the corresponding tags in the database to get their slugs, ignoring case
            tag_records = await self.db.tag.find_many(
                where={'name': {'in': tag_names_from_query, 'mode': 'insensitive'}}
            )
            
            # Use the slugs to build the CQL query
            if not tag_records:
                 # If no valid tags were found, return no results
                return {"items": [], "total": 0, "page": 1, "pageSize": page_size, "hasNext": False}

            label_clauses = [f'label = "{tag.slug}"' for tag in tag_records]
            specific_cql = ' and '.join(label_clauses)
        else:  # Default to 'all' or 'content'
            specific_cql = f'text ~ "{sanitized_query}"'

        # 2. Add sorting clause
        order_by_clause = ""
        if sort == "date":
            order_by_clause = " order by lastModified desc"
        
        full_cql = f"{base_cql} and {specific_cql}{order_by_clause}"
        
        # 3. Search Confluence using the constructed CQL
        limit = page_size + 1
        start = (page - 1) * page_size
        
        search_result_data = self.confluence_repo.search_cql(full_cql, start=start, limit=limit, expand="body.view,version,metadata.labels,ancestors")
        
        # 4. Process the results and handle pagination
        raw_results = search_result_data.get('results', [])
        has_next_page = len(raw_results) > page_size
        
        if has_next_page:
            raw_results = raw_results[:-1]

        # 5. Asynchronously transform the raw results into the Article schema
        article_promises = [self._transform_raw_page_to_article(result) for result in raw_results]
        
        articles_or_none = await asyncio.gather(*article_promises)
        valid_articles = [article for article in articles_or_none if article is not None]

        total_results = start + len(valid_articles) + (1 if has_next_page else 0)

        return {
            "items": valid_articles,
            "total": total_results,
            "page": page,
            "pageSize": page_size,
            "hasNext": has_next_page
        }

    def get_attachment_data(self, page_id: str, file_name: str) -> Optional[StreamingResponse]:
        """Pass-through to ConfluenceRepository to get attachment data."""
        return self.confluence_repo.get_attachment_data(page_id, file_name)

    async def get_recent_articles(self, limit: int = 6) -> List[Article]:
        """Fetches recent articles directly from the local DB."""
        return await self.page_repo.get_recent_articles(limit)

    async def get_popular_articles(self, limit: int = 6) -> List[Article]:
        """Fetches popular articles (by views) directly from the local DB."""
        return await self.page_repo.get_popular_articles(limit)

    async def get_whats_new(self, limit: int = 20) -> List[Article]:
        """Fetches "what's new" (recent articles) from the local DB."""
        return await self.page_repo.get_recent_articles(limit)
    
    async def get_all_tags(self) -> List[Tag]:
        """Fetches all unique tags from the local DB."""
        return await self.page_repo.get_all_tags()

    # --- CMS & Admin Endpoints (Orchestration) ---

    async def create_page_for_review(self, page_data: PageCreate, author_id: int, author_name: str) -> dict:
        """
        Orchestrates the creation of a new page for review.
        1. Create in Confluence -> 2. Create in local DB -> 3. Notify Admins
        """
        page_id = None
        try:
            # 1. Convert HTML to Confluence Storage Format
            translated_content = html_to_storage_format(page_data.content)
            
            # 2. Create page in Confluence
            new_page_in_confluence = self.confluence_repo.create_page(
                title=page_data.title,
                parent_id=page_data.parent_id,
                content_storage_format=translated_content,
                author_name=author_name
            )
            if not new_page_in_confluence:
                raise HTTPException(status_code=500, detail="Failed to create page in Confluence.")
            
            page_id = new_page_in_confluence['id']
            updated_at = new_page_in_confluence['version']['when']

            # 3. Create the Page metadata record in our DB
            page = await self.page_repo.create_page(
                confluence_id=page_id,
                title=page_data.title,
                slug=self._slugify(page_data.title),
                description=page_data.description,
                page_type=PageType.ARTICLE, # New pages are always articles
                parent_confluence_id=page_data.parent_id,
                author_name=author_name,
                updated_at_str=updated_at,
                tag_names=page_data.tags
            )
            
            # 4. Create the ArticleSubmission record
            await self.submission_repo.create_submission(
                confluence_id=page_id,
                title=page_data.title,
                author_id=author_id
            )

            # 5. Handle Attachments and Labels in Confluence
            self.confluence_repo.upload_attachments(page_id, page_data.attachments)
            self.confluence_repo.add_label(page_id, 'status-unpublished')
            if page_data.tags:
                tag_records = await self.db.tag.find_many(where={'name': {'in': page_data.tags}})
                for tag in tag_records:
                    self.confluence_repo.add_label(page_id, tag.slug)

            # 6. Notify admins
            await self.notification_service.notify_admins_of_submission(
                title=page_data.title,
                author_name=author_name
            )
                
            return {"id": page_id, "title": page_data.title, "status": "unpublished"}

        except Exception as e:
            print(f"Failed to create page for review: {e}")
            if page_id: # Attempt to clean up Confluence if DB write failed
                try:
                    self.confluence_repo.delete_page(page_id)
                    print(f"Cleaned up draft page {page_id} in Confluence after DB error.")
                except Exception as cleanup_e:
                    print(f"Failed to clean up draft page {page_id}: {cleanup_e}")
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=503, detail="Failed to create page.")
    
    async def get_page_details_for_edit(self, page_id: str) -> Optional[PageDetailResponse]:
        """
        Gathers all necessary data for the admin edit page.
        - Fetches live content from Confluence.
        - Fetches metadata (tags, parent) from the local database.
        """
        page_from_confluence = self.confluence_repo.get_page_by_id(page_id, expand="body.view")
        if not page_from_confluence:
            return None
        
        # 2. Fetch metadata from our fast local DB
        page_from_db = await self.page_repo.get_page_by_id(page_id)
        if not page_from_db:
            return None

        return PageDetailResponse(
            title=page_from_db.title,
            description=page_from_db.description,
            content=page_from_confluence.get("body", {}).get("view", {}).get("value", ""),
            parent_id=page_from_db.parentConfluenceId,
            tags=[tag.name for tag in page_from_db.tags]
        )

    async def update_page(self, page_id: str, page_data: PageUpdate, current_user: UserResponse) -> bool:
        """
        Orchestrates updating a page. If the user is the author of a rejected article,
        this action will automatically resubmit it for review.
        """
        try:
            author_name = current_user.name # Get author name from the user object

            # 1. Convert HTML and update in Confluence
            translated_content = html_to_storage_format(page_data.content)
            
            current_page_data = self.confluence_repo.get_page_by_id(page_id, expand="version,metadata.labels")
            if not current_page_data:
                 raise HTTPException(status_code=404, detail="Page to update not found in Confluence.")
            
            updated_page_data = self.confluence_repo.update_page(
                page_id=page_id,
                title=page_data.title,
                body=translated_content,
                parent_id=page_data.parent_id,
                current_version_number=current_page_data["version"]["number"] + 1,
                version_comment=f"Content updated by {author_name} via Knowledge Hub portal"
            )
            if not updated_page_data:
                raise HTTPException(status_code=500, detail="Failed to update page in Confluence.")
            
            updated_at_str = updated_page_data["version"]["when"]

            # 2. Check if this update should trigger a resubmission
            submission = await self.submission_repo.get_by_confluence_id(page_id)

            # Resubmit ONLY IF the submission was rejected AND the person editing is the original author.
            if (
                submission and
                submission.status == ArticleSubmissionStatus.REJECTED and
                submission.authorId == current_user.id
            ):
                print(f"Author {current_user.name} is resubmitting page {page_id}. Changing status to PENDING_REVIEW.")
                
                # Update labels in Confluence for resubmission
                self.confluence_repo.remove_label(page_id, "status-rejected")
                self.confluence_repo.add_label(page_id, "status-unpublished")

                # Update the submission status in our DB (comment is not cleared)
                await self.submission_repo.update_status(page_id, ArticleSubmissionStatus.PENDING_REVIEW)
                
                # Notify admins of the resubmission
                await self.notification_service.notify_admins_of_resubmission(
                    title=page_data.title,
                    author_name=author_name
                )

            # 3. Update the local Page record metadata
            await self.page_repo.update_page_metadata(
                confluence_id=page_id,
                title=page_data.title,
                slug=self._slugify(page_data.title),
                description=page_data.description,
                updated_at_str=updated_at_str,
                parent_id=page_data.parent_id,
                tag_names=page_data.tags
            )

            # 4. Sync labels/tags in Confluence if a tag list was sent
            if page_data.tags is not None:
                existing_labels = {l['name'] for l in current_page_data.get("metadata", {}).get("labels", {}).get("results", []) if not l['name'].startswith('status-')}
                
                new_tag_records = await self.db.tag.find_many(where={'name': {'in': page_data.tags}})
                new_slugs = {tag.slug for tag in new_tag_records}
                
                tags_to_add = new_slugs - existing_labels
                tags_to_remove = existing_labels - new_slugs

                for slug in tags_to_add:
                    self.confluence_repo.add_label(page_id, slug)
                for slug in tags_to_remove:
                    self.confluence_repo.remove_label(page_id, slug)
            
            # 5. Handle any new attachments uploaded during the edit session
            if page_data.attachments:
                print(f"Uploading {len(page_data.attachments)} new attachments to page {page_id}.")
                self.confluence_repo.upload_attachments(page_id, page_data.attachments)

            # 6. Also update the submission record's title to keep it in sync
            await self.submission_repo.update_title(page_id, page_data.title)
            
            return True
        except Exception as e:
            print(f"Error updating page {page_id}: {e}")
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=503, detail=f"Failed to update page {page_id}.")


    async def get_article_for_preview(self, page_id: str) -> Optional[Article]:
        """
        Fetches a raw page from Confluence for admin preview, bypassing local DB.
        """
        page_data = self.confluence_repo.get_page_by_id(page_id, expand="body.view,version,metadata.labels,ancestors")
        if not page_data:
            return None
        # Use await here because the transform method is now async
        return await self._transform_raw_page_to_article(page_data, is_admin_view=True)

    async def get_pending_submissions(self, current_user: UserResponse = None) -> List[Article]:
        # 1. If Global Admin, return everything
        if not current_user or current_user.role == "ADMIN":
            pending_submissions = await self.submission_repo.get_pending_submissions()
        else:
            # 2. If Group Admin, get allowed page IDs
            # We reuse the PageRepository logic we fixed in Stage 2
            allowed_ids_set = await self.page_repo.get_all_managed_and_descendant_ids(current_user)
            
            if not allowed_ids_set:
                return []
                
            pending_submissions = await self.submission_repo.get_pending_submissions_for_pages(list(allowed_ids_set))

        return [
            Article.model_validate({
                "id": sub.confluencePageId,
                "title": sub.title,
                "author": sub.author.name if sub.author else "Unknown",
                "updatedAt": sub.updatedAt.isoformat(),
                "slug": self._slugify(sub.title),
                "excerpt": sub.page.description if sub.page else "Description not available.",
                "description": sub.page.description if sub.page else "Description not available.",
                "html": "", "tags": [], "group": "unknown", "subsection": "unknown",
                "views": 0, "readMinutes": 1
            }) for sub in pending_submissions
        ]

    # In server/app/services/confluence_service.py

    async def approve_page(self, page_id: str) -> bool:
        """
        Orchestrates approving a page.
        1. Update labels -> 2. Get data -> 3. Sync to DB -> 4. Update Parent's Type -> 5. Notify author
        """
        try:
            # 1. Update labels in Confluence
            self.confluence_repo.remove_label(page_id, "status-unpublished")
            self.confluence_repo.remove_label(page_id, "status-rejected") # Clean up just in case

            # 2. Get latest data from Confluence for sync
            page_data = self.confluence_repo.get_page_by_id(page_id, expand="body.view,version,metadata.labels,ancestors")
            if not page_data:
                raise HTTPException(status_code=404, detail="Page not found in Confluence after approval.")

            # 3. Determine Page Type for the approved page itself
            has_children = self.confluence_repo.check_has_children(page_id)
            page_type = PageType.SUBSECTION if has_children else PageType.ARTICLE
            
            # 4. Sync all metadata (including tags) to our local DB
            await self.page_repo.sync_page_from_confluence_data(page_id, page_data, page_type)

            # --- THIS IS THE FIX ---
            # 5. Now that the child is approved, ensure its parent is a SUBSECTION
            ancestors = page_data.get('ancestors', [])
            if ancestors:
                parent_id = ancestors[-1]['id']
                await self.page_repo.ensure_parent_is_subsection(parent_id)
            # --- END OF FIX ---

            # 6. Update the submission status and notify the author
            submission = await self.submission_repo.update_status(
                page_id, 
                ArticleSubmissionStatus.PUBLISHED,
                comment=None
            )
            
            if submission:
                await self.notification_service.notify_author_of_approval(
                    author_id=submission.authorId,
                    title=submission.title,
                    page_id=page_id
                )
            return True
        except Exception as e:
            # ... (error handling remains the same)
            print(f"Error approving page {page_id}: {e}")
            try:
                self.confluence_repo.add_label(page_id, "status-unpublished")
            except Exception as rollback_e:
                print(f"Error during rollback of approval for page {page_id}: {rollback_e}")
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=503, detail=f"Failed to approve and sync page {page_id}.")

    async def reject_page(self, page_id: str, comment: Optional[str] = None) -> bool:
        """
        Orchestrates rejecting a page.
        1. Add comment/labels in Confluence -> 2. Update local status -> 3. Notify author
        """
        try:
            # 1. Add rejection comment and update labels in Confluence
            if comment: 
                self.confluence_repo.post_comment(page_id, comment)
            self.confluence_repo.remove_label(page_id, "status-unpublished")
            self.confluence_repo.add_label(page_id, "status-rejected")
            
            # 2. Update the local submission status
            submission = await self.submission_repo.update_status(
                page_id, 
                ArticleSubmissionStatus.REJECTED,
                comment=comment # Pass the comment here
            )
            
            # 3. Notify the author
            if submission:
                await self.notification_service.notify_author_of_rejection(
                    author_id=submission.authorId,
                    title=submission.title
                )
            return True
        except Exception as e:
            print(f"Error rejecting page {page_id}: {e}")
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=503, detail=f"Failed to reject page {page_id}.")

    async def resubmit_page_for_review(self, page_id: str, author_name: str) -> bool:
        """
        Orchestrates resubmitting a page.
        1. Update labels in Confluence -> 2. Update local status -> 3. Notify admins
        """
        try:
            # 1. Update labels in Confluence
            self.confluence_repo.remove_label(page_id, "status-rejected")
            self.confluence_repo.add_label(page_id, "status-unpublished")
            
            # 2. Update local submission status
            submission = await self.submission_repo.update_status(page_id, ArticleSubmissionStatus.PENDING_REVIEW)
            
            # 3. Notify admins
            if submission:
                await self.notification_service.notify_admins_of_resubmission(
                    title=submission.title,
                    author_name=author_name
                )
            return True
        except Exception as e:
            print(f"Error resubmitting page {page_id}: {e}")
            raise HTTPException(status_code=503, detail=f"Failed to resubmit page {page_id}.")

    async def get_submissions_by_author(self, author_id: int) -> List[dict]:
        """Fetches submissions for an author from the repository."""
        submissions = await self.submission_repo.get_by_author_id(author_id)
        return [sub.model_dump() for sub in submissions]
    
    async def delete_page_permanently(self, page_id: str) -> bool:
        """
        Orchestrates deleting a page completely, but only if it has no children.
        """
        try:
            # Check for children in our local database first.
            has_children = await self.page_repo.has_children(page_id)
            if has_children:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This page cannot be deleted because it has child pages. Please delete its children first."
                )

            # If the check passes, proceed with the original deletion logic.
            self.confluence_repo.delete_page(page_id)
            await self.submission_repo.delete_by_confluence_id(page_id)
            await self.page_repo.delete_by_confluence_id(page_id)
            
            return True
        except Exception as e:
            print(f"Error during permanent deletion of page {page_id}: {e}")
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=503, detail=str(e))
    
    async def delete_pages_in_bulk(self, page_ids: List[str]) -> dict:
        """
        Attempts to delete a list of pages. Returns a summary of successes and failures.
        """
        deleted_ids = []
        failed_items = []

        for page_id in page_ids:
            try:
                # Reuse our single-delete logic which now contains the child check
                success = await self.delete_page_permanently(page_id)
                if success:
                    deleted_ids.append(page_id)
            except HTTPException as e:
                failed_items.append({"id": page_id, "reason": e.detail})
            except Exception as e:
                failed_items.append({"id": page_id, "reason": str(e)})

        return {"deleted": deleted_ids, "failed": failed_items}

    def get_page_tree(self, parent_id: Optional[str] = None) -> List[Dict]:
        """
        Fetches the page hierarchy for the CMS tree select.
        This still queries Confluence directly as it's a CMS-only feature
        and doesn't need to be hyper-fast.
        """
        nodes = []
        try:
            page_ids_to_fetch = []
            if parent_id is None:
                # Get root pages ("Departments", "Tools", etc.)
                page_ids_to_fetch = list(self.root_page_ids.values())
            else:
                # Get children of the requested parent
                child_pages = self.confluence_repo.get_child_pages(parent_id, limit=200)
                page_ids_to_fetch = [child['id'] for child in child_pages]

            # For each page, check if it has children
            for page_id in page_ids_to_fetch:
                page = self.confluence_repo.get_page_by_id(page_id, expand="")
                if not page:
                    continue
                
                # Check for grandchildren to set 'hasChildren'
                grand_children = self.confluence_repo.get_child_pages(page_id, limit=1)
                nodes.append({
                    "id": page['id'], 
                    "title": page['title'], 
                    "hasChildren": len(grand_children) > 0
                })
            
            return sorted(nodes, key=lambda x: x['title'])
        except Exception as e:
            print(f"Error fetching page tree for parent {parent_id}: {e}")
            raise HTTPException(status_code=503, detail="Could not fetch page hierarchy.")
        
    async def get_page_tree_with_permissions(self, user: UserResponse, parent_id: Optional[str] = None, allowed_only: bool = False) -> List[PageTreeNodeWithPermission]:
        """
        Fetches the page hierarchy, augmenting each node with an 'isAllowed' flag
        based on the user's group permissions. Can be filtered.
        """
        if allowed_only and user.role != 'ADMIN':
            # If filtering is requested for a non-admin, use the new repository method
            return await self.page_repo.get_filtered_tree_nodes_for_user(user, parent_id)
        
        allowed_page_ids = await self.page_repo.get_all_managed_and_descendant_ids(user)
        is_admin = user.role == 'ADMIN'

        child_pages = await self.page_repo.get_child_pages_for_index(parent_id)
        
        nodes_to_return = []
        for page in child_pages:
            has_children = await self.page_repo.has_children(page.confluenceId)
            is_node_allowed = is_admin or page.id in allowed_page_ids

            nodes_to_return.append(
                PageTreeNodeWithPermission(
                    id=page.confluenceId,
                    title=page.title,
                    hasChildren=has_children,
                    isAllowed=is_node_allowed
                )
            )
        
        return sorted(nodes_to_return, key=lambda x: x.title)

    async def get_page_tree(self, parent_id: Optional[str] = None) -> List[PageTreeNode]:
        """
        Orchestrates fetching the page hierarchy for the CMS tree select
        by calling the page repository, which uses the local database.
        """
        return await self.page_repo.get_tree_nodes_by_parent_id(parent_id)

    async def get_content_index_nodes(self, parent_id: Optional[str] = None, current_user: UserResponse = None) -> List[ContentNode]:
        """
        Fetches nodes for the admin content index page entirely from the local database.
        """
        nodes = []
        
        # 1. Determine permissions
        is_global_admin = current_user and current_user.role == "ADMIN"
        admin_page_ids = set()
        if current_user and not is_global_admin:
            admin_page_ids = await self.page_repo.get_admin_managed_page_ids(current_user.id)

        # 2. Get the relevant pages from our database
        child_pages_from_db = await self.page_repo.get_child_pages_for_index(parent_id)

        for page in child_pages_from_db:
            try:
                has_children = await self.page_repo.has_children(page.confluenceId)
                submission = await self.submission_repo.get_by_confluence_id_with_author(page.confluenceId)
                
                author_name, status = page.authorName or "System", ArticleSubmissionStatus.PUBLISHED
                if submission:
                    if submission.author:
                        author_name = submission.author.name
                    status = submission.status
                
                can_manage = is_global_admin or (page.confluenceId in admin_page_ids)

                nodes.append(ContentNode(
                    id=page.confluenceId, 
                    title=page.title, 
                    author=author_name, 
                    status=status, 
                    updatedAt=page.updatedAt, 
                    confluenceUrl=f"{self.settings.confluence_url}/spaces/{self.settings.confluence_space_key}/pages/{page.confluenceId}", 
                    children=[], 
                    hasChildren=has_children,
                    canManage=can_manage
                ))
            except Exception as e:
                print(f"Error processing DB node for page {page.confluenceId}: {e}")
                
        return nodes
    
    async def search_content_index(self, search_term: str) -> List[ContentNode]:
        """
        Searches for content index nodes by title from the local database
        and returns a flattened list.
        """
        if not search_term or len(search_term) < 2:
            return []

        nodes = []
        searched_pages = await self.page_repo.search_pages_for_index(search_term)

        for page in searched_pages:
            try:
                has_children = await self.page_repo.has_children(page.confluenceId)
                submission = await self.submission_repo.get_by_confluence_id_with_author(page.confluenceId)
                
                author_name, status = page.authorName or "System", ArticleSubmissionStatus.PUBLISHED
                if submission:
                    author_name = submission.author.name if submission.author else "Unknown"
                    status = submission.status
                
                nodes.append(ContentNode(
                    id=page.confluenceId, 
                    title=page.title, 
                    author=author_name, 
                    status=status, 
                    updatedAt=page.updatedAt, 
                    confluenceUrl=f"{self.settings.confluence_url}/spaces/{self.settings.confluence_space_key}/pages/{page.confluenceId}", 
                    children=[], 
                    hasChildren=has_children
                ))
            except Exception as e:
                print(f"Error processing searched DB node for page {page.confluenceId}: {e}")
                
        return nodes