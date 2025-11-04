# server/app/services/confluence_service.py
import re
from typing import List, Dict, Optional, Any
from bs4 import BeautifulSoup
from fastapi import HTTPException, status
from fastapi.responses import StreamingResponse

from app.config import Settings
from app.schemas.content_schemas import Article, Tag, Subsection, GroupInfo, PageContentItem, Ancestor
from app.schemas.cms_schemas import PageCreate, PageUpdate, ContentNode
from app.schemas.cms_schemas import ArticleSubmissionStatus
from app.utils.html_translator import html_to_storage_format
from prisma.enums import PageType

# Import Repositories and Services
from app.services.confluence_repository import ConfluenceRepository
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

        # Get startup data from the Confluence repository
        self.root_page_ids = self.confluence_repo.root_page_ids
        self.id_to_group_slug_map = self.confluence_repo.id_to_group_slug_map

    # --- Utility & Transformation Methods ---

    async def _slugify(self, text: str) -> str:
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
        
    def _get_group_from_ancestors(self, ancestors: List[Ancestor]) -> str:
        """Finds the root-level group (e.g., 'departments') from an ancestor list."""
        for ancestor in ancestors:
            if ancestor.id in self.id_to_group_slug_map:
                return self.id_to_group_slug_map[ancestor.id]
        return "unknown" # Fallback

    def _transform_raw_page_to_article(self, page_data: dict, is_admin_view: bool = False) -> Optional[Article]:
        """
        Transforms a raw Confluence page dictionary (from ConfluenceRepository)
        into a validated Article schema.
        
        This is used for older endpoints that rely purely on Confluence data.
        """
        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        label_names = {label.get("name") for label in raw_labels}
        
        # Don't show non-public articles unless it's an admin preview
        if not is_admin_view:
            if "status-unpublished" in label_names or "status-rejected" in label_names:
                return None

        ancestors = page_data.get('ancestors', [])
        if not ancestors: return None # Must have ancestors to determine group

        group_slug = self._get_group_from_ancestors(ancestors)
        subsection_slug = self._slugify(ancestors[-1]['title']) if ancestors else ""
        
        html_content = page_data.get("body", {}).get("view", {}).get("value", "")
        plain_text = self._get_plain_text(html_content)
        word_count = len(plain_text.split())
        read_minutes = max(1, round(word_count / 200))
        excerpt = (plain_text[:150] + '...') if len(plain_text) > 150 else plain_text
        
        status_labels = {"status-unpublished", "status-rejected"}
        tags = [
            Tag.model_validate(t.model_dump()) # Use model_dump() for Prisma -> Pydantic
            for label in raw_labels if label.get("name") not in status_labels
            for t in [self.confluence_repo.get_tag_by_name(label["name"])] if t # Helper to get Tag model
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
            "views": 0, # Views are not available from Confluence
            "readMinutes": read_minutes,
            "author": author_name
        }
        return Article.model_validate(article_data)

    # --- Knowledge Hub Read Endpoints (Orchestration) ---

    def get_groups(self) -> List[GroupInfo]:
        """Returns static group information."""
        return [
            GroupInfo(id='departments', title='Departments', description='Resources organized by team functions', icon='Building2'),
            GroupInfo(id='resource-centre', title='Resource Centre', description='Comprehensive knowledge base and docs', icon='BookOpen'),
            GroupInfo(id='tools', title='Tools', description='Development tools, utilities, and guides', icon='Wrench'),
        ]

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
        # --- FIX: Get parent page details to determine group and subsection slugs ---
        parent_page = await self.page_repo.get_page_by_id(parent_confluence_id)
        if not parent_page:
            raise HTTPException(status_code=404, detail="Parent page not found")

        ancestors = await self.page_repo.get_ancestors_from_db(parent_page)
        group_slug = self._get_group_from_ancestors(ancestors)
        subsection_slug = parent_page.slug # The parent *is* the subsection
        # --- END FIX ---

        paginated_result = await self.page_repo.get_paginated_children(parent_confluence_id, page, page_size)

        # Format the paginated items
        formatted_items = []
        for item in paginated_result["items"]:
            if item.pageType == PageType.SUBSECTION:
                # Pass empty HTML for list view
                formatted_items.append(await self.page_repo._format_page_as_subsection(item, group_slug, ""))
            else:
                # Pass correct group and subsection slug
                formatted_items.append(await self.page_repo._format_page_as_article(item, group_slug, subsection_slug))
        
        paginated_result["items"] = formatted_items
        return paginated_result

    async def get_article_by_id_hybrid(self, page_id: str) -> Optional[Article]:
        """
        HYBRID FETCH: Fetches metadata from local DB (fast) and content
        from Confluence (slow) and merges them for an ARTICLE.
        """
        
        # Step 1: Fetch metadata from DB
        page_metadata = await self.page_repo.get_page_by_id(confluence_id=page_id)
        if not page_metadata or page_metadata.pageType != PageType.ARTICLE:
            return None # Not found or not an article

        # Step 2: Fetch live content from Confluence
        html_content = ""
        read_minutes = 1 # Default
        try:
            html_content = self.confluence_repo.get_page_content(page_id)
            plain_text = self._get_plain_text(html_content)
            word_count = len(plain_text.split())
            read_minutes = max(1, round(word_count / 200))
        except Exception as e:
            print(f"CRITICAL: Could not fetch content for page {page_id} from Confluence. Error: {e}")
            html_content = "<p>Error: Could not load document content from the source.</p>"
        
        # Step 3: Get ancestors to determine group/subsection slugs
        ancestors = await self.page_repo.get_ancestors_from_db(page_metadata)
        group_slug = self._get_group_from_ancestors(ancestors)
        subsection_slug = ancestors[-1].title if ancestors else "unknown"

        # Step 4: Merge and format into Article schema
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
            subsection=await self._slugify(subsection_slug), # Slugify the title
            updatedAt=page_metadata.updatedAt.isoformat(),
            views=page_metadata.views,
            readMinutes=read_minutes,
            author=page_metadata.authorName
        )

    async def get_subsection_by_id_hybrid(self, page_id: str) -> Optional[Subsection]:
        """
        HYBRID FETCH: Fetches metadata from local DB (fast) and content
        from Confluence (slow) and merges them for a SUBSECTION.
        """
        
        # Step 1: Fetch metadata from DB
        page_metadata = await self.page_repo.get_page_by_id(confluence_id=page_id)
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

    async def search_content_hybrid(self, query: str, page: int, page_size: int) -> dict:
        """
        HYBRID SEARCH: Searches Confluence for relevant IDs, then enriches
        that list of IDs with metadata from our fast local DB.
        """
        # 1. Search Confluence for IDs
        cql = f'space = "{self.settings.confluence_space_key}" and text ~ "{query}" and label != "status-unpublished" and label != "status-rejected"'
        limit = page_size + 1
        start = (page - 1) * page_size
        
        search_results = self.confluence_repo.search_cql(cql, start=start, limit=limit, expand="title")
        
        raw_pages = search_results.get('results', [])
        has_next_page = len(raw_pages) > page_size
        if has_next_page:
            raw_pages = raw_pages[:-1] # Remove the extra item

        confluence_ids = [result['content']['id'] for result in raw_pages]
        if not confluence_ids:
            return {"items": [], "hasNext": False, "total": 0}

        # 2. Enrich these IDs with a single query to our local DB
        enriched_pages = await self.page_repo.get_pages_by_ids(confluence_ids)

        # 3. Re-order the DB results to match Confluence's relevance order
        enriched_map = {page.confluenceId: page for page in enriched_pages}
        ordered_enriched_pages = [enriched_map[cid] for cid in confluence_ids if cid in enriched_map]
        
        # 4. Format as Articles (search results are always Articles)
        formatted_articles = []
        for page in ordered_enriched_pages:
            # We don't know group/subsection slugs here without N+1 queries, so set to unknown
            formatted_articles.append(
                await self.page_repo._format_page_as_article(page, "unknown", "unknown")
            )

        return {
            "items": formatted_articles,
            "hasNext": has_next_page,
            "total": -1 # Total is not easily available from CQL
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
                slug=await self._slugify(page_data.title),
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
            for tag in page_data.tags:
                self.confluence_repo.add_label(page_id, tag)

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

    async def update_page(self, page_id: str, page_data: PageUpdate) -> bool:
        """
        Orchestrates updating a page.
        1. Update in Confluence -> 2. Sync metadata to local DB
        """
        try:
            # 1. Convert HTML and update in Confluence
            translated_content = html_to_storage_format(page_data.content)
            
            # Get current version number
            current_page_data = self.confluence_repo.get_page_by_id(page_id, expand="version")
            if not current_page_data:
                 raise HTTPException(status_code=404, detail="Page to update not found in Confluence.")
            current_version = current_page_data["version"]["number"]

            updated_page_data = self.confluence_repo.update_page(
                page_id=page_id,
                title=page_data.title,
                content_storage_format=translated_content,
                current_version_number=current_version + 1,
                version_comment="Content updated via Knowledge Hub portal"
            )
            if not updated_page_data:
                raise HTTPException(status_code=500, detail="Failed to update page in Confluence.")
            
            updated_at_str = updated_page_data["version"]["when"]

            # 2. Update the local Page record
            await self.page_repo.update_page_metadata(
                confluence_id=page_id,
                title=page_data.title,
                slug=await self._slugify(page_data.title),
                description=page_data.description,
                updated_at_str=updated_at_str
            )

            # 3. Also update the submission record's title
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
        # This old transform is fine for a preview, as it's not tied to our DB
        return self._transform_raw_page_to_article(page_data, is_admin_view=True)

    async def get_pending_submissions(self) -> List[Article]:
        """Fetches pending submissions from the DB and formats them as Articles."""
        pending_submissions = await self.submission_repo.get_pending_submissions()
        
        # Format as Article model for the frontend
        return [
            Article.model_validate({
                "id": sub.confluencePageId,
                "title": sub.title,
                "author": sub.author.name if sub.author else "Unknown",
                "updatedAt": sub.updatedAt.isoformat(),
                "slug": await self._slugify(sub.title),
                "excerpt": "Content available for preview.",
                "description": "Content available for preview.",
                "html": "", "tags": [], "group": "unknown", "subsection": "unknown",
                "views": 0, "readMinutes": 1
            }) for sub in pending_submissions
        ]

    async def approve_page(self, page_id: str) -> bool:
        """
        Orchestrates approving a page.
        1. Update labels in Confluence -> 2. Sync latest data to local DB -> 3. Notify author
        """
        try:
            # 1. Update labels in Confluence
            self.confluence_repo.remove_label(page_id, "status-unpublished")
            self.confluence_repo.remove_label(page_id, "status-rejected") # Clean up just in case

            # 2. Get latest data from Confluence for sync
            page_data = self.confluence_repo.get_page_by_id(page_id, expand="body.view,version,metadata.labels")
            if not page_data:
                raise HTTPException(status_code=404, detail="Page not found in Confluence after approval.")

            # 3. Determine Page Type
            has_children = self.confluence_repo.check_has_children(page_id)
            page_type = PageType.SUBSECTION if has_children else PageType.ARTICLE
            
            # 4. Sync all metadata (including tags) to our local DB
            await self.page_repo.sync_page_from_confluence_data(page_id, page_data, page_type)

            # 5. Update the submission status and notify the author
            submission = await self.submission_repo.update_status(page_id, ArticleSubmissionStatus.PUBLISHED)
            
            if submission:
                await self.notification_service.notify_author_of_approval(
                    author_id=submission.authorId,
                    title=submission.title,
                    page_id=page_id
                )
            return True
        except Exception as e:
            print(f"Error approving page {page_id}: {e}")
            # Attempt to roll back by re-adding the unpublished label
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
            submission = await self.submission_repo.update_status(page_id, ArticleSubmissionStatus.REJECTED)
            
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
        # Convert to dict for the router, as Pydantic models are used for response
        return [sub.model_dump() for sub in submissions]
    
    async def delete_page_permanently(self, page_id: str) -> bool:
        """
        Orchestrates deleting a page.
        1. Delete from Confluence -> 2. Delete submission from local DB
        """
        try:
            # 1. Delete from Confluence
            self.confluence_repo.delete_page(page_id)
            
            # 2. Delete submission from local DB
            # The Page record itself is deleted via cascading delete in the DB
            await self.submission_repo.delete_by_confluence_id(page_id)
            return True
        except Exception as e:
            print(f"Error during permanent deletion of page {page_id}: {e}")
            # If deletion failed, the data is now out of sync.
            # A more robust system might re-try or flag for admin attention.
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=503, detail="Failed to delete the page.")

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

    async def get_content_index_nodes(self, parent_id: Optional[str] = None) -> List[ContentNode]:
        """
        Fetches nodes for the admin content index page.
        This is a hybrid query: gets hierarchy from Confluence,
        but submission status/author from the local DB.
        """
        nodes = []
        page_ids_to_fetch = []
        try:
            if parent_id is None:
                page_ids_to_fetch = list(self.root_page_ids.values())
            else:
                child_pages = self.confluence_repo.get_child_pages(parent_id, limit=200)
                page_ids_to_fetch = [child['id'] for child in child_pages]
        except Exception as e:
            print(f"Error fetching page hierarchy for parent {parent_id}: {e}")
            raise HTTPException(status_code=503, detail="Could not fetch page hierarchy.")

        for page_id in page_ids_to_fetch:
            try:
                page_details = self.confluence_repo.get_page_by_id(page_id, expand="version")
                if not page_details: 
                    continue

                grand_children = self.confluence_repo.get_child_pages(page_id, limit=1)
                has_children = len(grand_children) > 0
                
                # Get submission status and author from our local DB
                submission = await self.submission_repo.get_by_confluence_id_with_author(page_id)
                
                author_name, status = "System", ArticleSubmissionStatus.PUBLISHED
                if submission:
                    if submission.author:
                        author_name = submission.author.name
                    status = submission.status
                
                nodes.append(ContentNode(
                    id=page_id, 
                    title=page_details['title'], 
                    author=author_name, 
                    status=status, 
                    updatedAt=page_details['version']['when'], 
                    confluenceUrl=f"{self.settings.confluence_url}/spaces/{self.settings.confluence_space_key}/pages/{page_id}", 
                    children=[], 
                    hasChildren=has_children
                ))
            except Exception as e:
                print(f"Error processing node for page {page_id}: {e}")
                
        return sorted(nodes, key=lambda x: x.title)

