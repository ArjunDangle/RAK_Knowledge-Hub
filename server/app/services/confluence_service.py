# server/app/services/confluence_service.py
import re
from typing import List, Dict, Optional, Any
from bs4 import BeautifulSoup
from fastapi import HTTPException, status

from app.config import Settings
from app.schemas.content_schemas import Article, Tag, Subsection, GroupInfo, PageContentItem, Ancestor
from app.schemas.cms_schemas import PageCreate, ContentNode
from app.schemas.cms_schemas import ArticleSubmissionStatus, PageUpdate
from prisma.enums import PageType

# Import Repositories and Services
from app.services.notification_service import NotificationService
from app.services.page_repository import PageRepository
from app.services.submission_repository import SubmissionRepository
from app.services.confluence_repository import ConfluenceRepository

class ConfluenceService:
    """
    Acts as an orchestrator, coordinating repositories and other services
    to fulfill business logic requirements.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        
        # Initialize all repositories and services
        self.notification_service = NotificationService()
        self.page_repo = PageRepository()
        self.submission_repo = SubmissionRepository()
        self.confluence_repo = ConfluenceRepository(settings)

        # Get root page IDs (e.g., "Departments") from the Confluence repo
        self.root_page_ids: Dict[str, str] = self.confluence_repo.root_page_ids
        self.id_to_group_slug_map: Dict[str, str] = {v: k for k, v in self.root_page_ids.items()}

    # --- Helper Methods ---

    def _get_plain_text(self, html: str) -> str:
        """Helper to extract plain text from HTML."""
        if not html: return ""
        soup = BeautifulSoup(html, 'html.parser')
        return soup.get_text(" ", strip=True)
    
    async def _slugify(self, text: str) -> str:
        """Internal slugify, as this repo doesn't import from Confluence service."""
        import re
        text = text.lower()
        text = re.sub(r'[\s_&]+', '-', text)
        text = re.sub(r'[^\w\s-]', '', text)
        return text

    def _get_group_from_ancestors(self, ancestors: List[Ancestor]) -> str:
        """Finds the group slug (e.g., 'departments') from a list of ancestors."""
        for ancestor in ancestors:
            if ancestor.id in self.id_to_group_slug_map:
                return self.id_to_group_slug_map[ancestor.id]
        return "unknown"

    # --- Knowledge Hub Endpoints ---

    def get_groups(self) -> List[GroupInfo]:
        """Returns static group information."""
        return [
            GroupInfo(id='departments', title='Departments', description='Resources organized by team functions', icon='Building2'),
            GroupInfo(id='resource-centre', title='Resource Centre', description='Comprehensive knowledge base and docs', icon='BookOpen'),
            GroupInfo(id='tools', title='Tools', description='Development tools, utilities, and guides', icon='Wrench'),
        ]

    async def get_subsections_by_group(self, group_slug: str) -> List[Subsection]:
        """Gets top-level subsections for a group (e.g., 'Departments')."""
        root_page_id = self.root_page_ids.get(group_slug)
        if not root_page_id:
            return []
        return await self.page_repo.get_subsections_by_parent_id(root_page_id, group_slug)

    async def get_page_contents_from_db(self, parent_confluence_id: str, page: int, page_size: int) -> dict:
        """Gets paginated children (Articles & Subsections) for a parent page."""
        paginated_result = await self.page_repo.get_paginated_children(parent_confluence_id, page, page_size)
        
        # Get parent page to find ancestors
        parent_page = await self.page_repo.get_page_by_id(parent_confluence_id)
        group_slug = "unknown"
        subsection_slug = "unknown"
        
        if parent_page:
            ancestors = await self.page_repo.get_ancestors_from_db(parent_page)
            group_slug = self._get_group_from_ancestors(ancestors)
            # The parent page is the subsection
            subsection_slug = parent_page.slug 

        # Format the paginated items
        formatted_items = []
        for item in paginated_result["items"]:
            if item.pageType == PageType.SUBSECTION:
                # Pass empty HTML for list view
                formatted_items.append(await self.page_repo._format_page_as_subsection(item, group_slug, ""))
            else:
                formatted_items.append(await self.page_repo._format_page_as_article(item, group_slug, subsection_slug))
        
        paginated_result["items"] = formatted_items
        return paginated_result

    async def get_article_by_id_hybrid(self, page_id: str) -> Optional[Article]:
        """Fetches metadata from DB and content from Confluence for an ARTICLE."""
        
        # Step 1: Fetch metadata from DB
        page_metadata = await self.page_repo.get_page_by_id(confluence_id=page_id)
        if not page_metadata or page_metadata.pageType != PageType.ARTICLE:
            return None # Not found or not an article

        # Step 2: Fetch live content from Confluence
        try:
            html_content = self.confluence_repo.get_page_content(page_id)
            plain_text = self._get_plain_text(html_content)
            word_count = len(plain_text.split())
            read_minutes = max(1, round(word_count / 200))
        except Exception as e:
            print(f"CRITICAL: Could not fetch content for page {page_id} from Confluence. Error: {e}")
            html_content = "<p>Error: Could not load document content from the source.</p>"
            read_minutes = 1
        
        # Step 3: Get ancestors to determine group/subsection slugs
        ancestors = await self.page_repo.get_ancestors_from_db(page_metadata)
        group_slug = self._get_group_from_ancestors(ancestors)
        subsection_slug = ancestors[-1].slug if ancestors else "unknown"

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
            subsection=subsection_slug,
            updatedAt=page_metadata.updatedAt.isoformat(),
            views=page_metadata.views,
            readMinutes=read_minutes,
            author=page_metadata.authorName
        )

    async def get_subsection_by_id_hybrid(self, page_id: str) -> Optional[Subsection]:
        """Fetches metadata from DB and content from Confluence for a SUBSECTION."""
        
        # Step 1: Fetch metadata from DB
        page_metadata = await self.page_repo.get_page_by_id(confluence_id=page_id)
        if not page_metadata or page_metadata.pageType != PageType.SUBSECTION:
            return None # Not found or not a subsection

        # Step 2: Fetch live content from Confluence
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
        """Searches Confluence for IDs, then enriches with local DB metadata."""
        
        # Step 1: Search Confluence for IDs
        cql = f'space = "{self.settings.confluence_space_key}" and text ~ "{query}" and label != "status-unpublished" and label != "status-rejected"'
        
        # --- THIS IS THE FIX ---
        # We must expand 'content' to get the result structure {'content': {'id': ...}}
        search_result_raw = self.confluence_repo.search_cql(
            cql=cql,
            start=(page - 1) * page_size,
            limit=page_size + 1,
            expand="content" # <-- Was incorrectly set to ""
        )
        # --- END OF FIX ---
        
        search_results = search_result_raw.get('results', [])
        has_next_page = len(search_results) > page_size
        if has_next_page:
            search_results = search_results[:-1] # Trim the extra item

        confluence_ids = [result['content']['id'] for result in search_results]

        if not confluence_ids:
            return {"items": [], "total": 0, "page": 1, "pageSize": page_size, "hasNext": False}

        # Step 2: Enrich these IDs with our fast local database.
        enriched_pages = await self.page_repo.get_pages_by_ids(confluence_ids)
        enriched_map = {page.confluenceId: page for page in enriched_pages}
        
        # Re-order the DB results to match the relevance order from Confluence search
        ordered_enriched_pages = [enriched_map[cid] for cid in confluence_ids if cid in enriched_map]

        # Step 3: Format as Articles (search results are always Articles)
        formatted_articles = []
        for page in ordered_enriched_pages:
            # We don't know group/subsection slugs here without N+1 queries, so set to unknown
            formatted_articles.append(
                await self.page_repo._format_page_as_article(page, "unknown", "unknown")
            )

        return {
            "items": formatted_articles,
            "total": -1, # Total is not available from CQL without another query
            "page": page,
            "pageSize": page_size,
            "hasNext": has_next_page
        }

    async def get_recent_articles(self, limit: int = 6) -> List[Article]:
        """Gets recent articles from the Page Repository."""
        return await self.page_repo.get_recent_articles(limit)

    async def get_popular_articles(self, limit: int = 6) -> List[Article]:
        """Gets popular articles from the Page Repository."""
        return await self.page_repo.get_popular_articles(limit)

    async def get_all_tags(self) -> List[Tag]:
        """Gets all tags from the Page Repository."""
        return await self.page_repo.get_all_tags()
        
    def get_attachment_data(self, page_id: str, file_name: str):
        """Streams an attachment directly from the Confluence Repository."""
        return self.confluence_repo.get_attachment_data(page_id, file_name)

    # --- CMS / Admin Endpoints ---

    def get_page_tree(self, parent_id: Optional[str] = None) -> List[Dict]:
        """Gets the page hierarchy from the Confluence Repository."""
        return self.confluence_repo.get_page_tree(parent_id)

    async def get_pending_submissions(self) -> List[Article]:
        """Gets all pending submissions from the Submission Repository."""
        pending_submissions = await self.submission_repo.get_pending_submissions()
        
        articles = []
        for sub in pending_submissions:
            author_name = sub.author.name if sub.author else "Unknown"
            # Create a lightweight Article object for the list view
            articles.append(Article(
                id=sub.confluencePageId,
                title=sub.title,
                author=author_name,
                updatedAt=sub.updatedAt.isoformat(),
                slug=await self._slugify(sub.title),
                excerpt="Content available for preview.",
                description="Content available for preview.",
                html="",
                tags=[],
                group="unknown",
                subsection="unknown",
                views=0,
                readMinutes=1
            ))
        return articles

    async def get_submissions_by_author(self, author_id: int) -> List[dict]:
        """Gets all submissions for a specific author."""
        submissions = await self.submission_repo.get_by_author_id(author_id)
        # Return as dicts for the Pydantic model in the router
        return [sub.model_dump() for sub in submissions]

    async def create_page_for_review(self, page_data: PageCreate, author_id: int, author_name: str) -> dict:
        """
        Orchestrates the creation of a new page.
        1. Create in Confluence
        2. Create Page in DB
        3. Create Submission in DB
        4. Upload Attachments to Confluence
        5. Set Labels in Confluence
        6. Notify Admins
        """
        page_id = None
        try:
            # Step 1: Create page in Confluence
            created_page_data = self.confluence_repo.create_page(
                title=page_data.title,
                parent_id=page_data.parent_id,
                content=page_data.content,
                author_name=author_name
            )
            page_id = created_page_data['id']
            updated_at_str = created_page_data['version']['when']

            # Step 2: Create Page in our DB
            await self.page_repo.create_page(
                confluence_id=page_id,
                title=page_data.title,
                slug=await self._slugify(page_data.title),
                description=page_data.description,
                page_type=PageType.ARTICLE,
                parent_confluence_id=page_data.parent_id,
                author_name=author_name,
                updated_at_str=updated_at_str,
                tag_names=page_data.tags
            )
            
            # Step 3: Create Submission in our DB
            await self.submission_repo.create_submission(
                confluence_id=page_id,
                title=page_data.title,
                author_id=author_id
            )

            # Step 4: Upload Attachments
            self.confluence_repo.upload_attachments(page_id, page_data.attachments)
            
            # Step 5: Set initial labels
            self.confluence_repo.add_label(page_id, 'status-unpublished')
            for tag in page_data.tags:
                self.confluence_repo.add_label(page_id, tag)

            # Step 6: Notify Admins
            await self.notification_service.notify_admins_of_submission(
                title=page_data.title,
                author_name=author_name
            )
                
            return {"id": page_id, "title": page_data.title, "status": "unpublished"}

        except Exception as e:
            print(f"Failed to create page for review: {e}")
            if page_id:
                # Rollback: Delete the page from Confluence if DB operations failed
                self.confluence_repo.delete_page(page_id)
                print(f"Cleaned up draft page {page_id} in Confluence after DB error.")
            raise HTTPException(status_code=503, detail="Failed to create page.")

    async def update_page(self, page_id: str, page_data: PageUpdate) -> bool:
        """
        Orchestrates updating a page.
        1. Get current page version
        2. Update Confluence content
        3. Get new version info
        4. Update local Page metadata
        5. Update local Submission title
        """
        try:
            # Step 1: Get current page version
            current_page = self.confluence_repo.get_page_by_id(page_id, expand="version")
            if not current_page:
                 raise HTTPException(status_code=404, detail="Page to update not found.")
            current_version_number = current_page["version"]["number"]

            # Step 2: Update Confluence
            updated_page_data = self.confluence_repo.update_page(
                page_id=page_id,
                title=page_data.title,
                content=page_data.content,
                current_version_number=current_version_number + 1,
                version_comment="Content updated via Knowledge Hub portal"
            )
            updated_at_str = updated_page_data["version"]["when"]

            # Step 3 & 4: Update local Page and Submission
            await self.page_repo.update_page_metadata(
                confluence_id=page_id,
                title=page_data.title,
                slug=await self._slugify(page_data.title),
                description=page_data.description,
                updated_at_str=updated_at_str
            )
            await self.submission_repo.update_title(page_id, page_data.title)
            return True
        except Exception as e:
            print(f"Error updating page {page_id}: {e}")
            raise HTTPException(status_code=503, detail=f"Failed to update page {page_id}.")

    async def approve_page(self, page_id: str) -> bool:
        """
        Orchestrates approving a page.
        1. Update labels in Confluence
        2. Get fresh data from Confluence
        3. Determine page type (has children?)
        4. Sync local Page record with fresh data
        5. Update local Submission status
        6. Notify author
        """
        try:
            # Step 1: Update labels
            self.confluence_repo.remove_label(page_id, "status-unpublished")
            self.confluence_repo.remove_label(page_id, "status-rejected")

            # Step 2: Get fresh data
            page_data = self.confluence_repo.get_page_by_id(page_id, expand="body.view,version,metadata.labels")
            if not page_data:
                raise HTTPException(status_code=404, detail="Page not found after approval.")

            # Step 3: Determine page type
            has_children = self.confluence_repo.check_has_children(page_id)
            page_type = PageType.SUBSECTION if has_children else PageType.ARTICLE
            
            # Step 4: Sync local Page record
            await self.page_repo.sync_page_from_confluence_data(
                confluence_id=page_id,
                page_data=page_data,
                page_type=page_type
            )

            # Step 5: Update local Submission
            submission = await self.submission_repo.update_status(
                page_id, ArticleSubmissionStatus.PUBLISHED
            )
            
            # Step 6: Notify author
            if submission:
                await self.notification_service.notify_author_of_approval(
                    author_id=submission.authorId,
                    title=submission.title,
                    page_id=page_id
                )
            return True
        except Exception as e:
            print(f"Error approving page {page_id}: {e}")
            self.confluence_repo.add_label(page_id, "status-unpublished") # Rollback
            raise HTTPException(status_code=503, detail=f"Failed to approve and sync page {page_id}.")

    async def reject_page(self, page_id: str, comment: Optional[str] = None) -> bool:
        """
        Orchestrates rejecting a page.
        1. Post comment to Confluence
        2. Update labels in Confluence
        3. Update local Submission status
        4. Notify author
        """
        try:
            if comment: 
                self.confluence_repo.post_comment(page_id, comment)
            
            self.confluence_repo.remove_label(page_id, "status-unpublished")
            self.confluence_repo.add_label(page_id, "status-rejected")
            
            submission = await self.submission_repo.update_status(
                page_id, ArticleSubmissionStatus.REJECTED
            )
            
            if submission:
                await self.notification_service.notify_author_of_rejection(
                    author_id=submission.authorId,
                    title=submission.title
                )
            return True
        except Exception as e:
            print(f"Error rejecting page {page_id}: {e}")
            raise HTTPException(status_code=503, detail=f"Failed to reject page {page_id}.")

    async def resubmit_page_for_review(self, page_id: str, author_name: str) -> bool:
        """
        Orchestrates resubmitting a page.
        1. Update labels in Confluence
        2. Update local Submission status
        3. Notify admins
        """
        try:
            self.confluence_repo.remove_label(page_id, "status-rejected")
            self.confluence_repo.add_label(page_id, "status-unpublished")
            
            submission = await self.submission_repo.update_status(
                page_id, ArticleSubmissionStatus.PENDING_REVIEW
            )
            
            if submission:
                await self.notification_service.notify_admins_of_resubmission(
                    title=submission.title,
                    author_name=author_name
                )
            return True
        except Exception as e:
            print(f"Error resubmitting page {page_id}: {e}")
            raise HTTPException(status_code=503, detail=f"Failed to resubmit page {page_id}.")
    
    async def delete_page_permanently(self, page_id: str) -> bool:
        """
        Orchestrates deleting a page from Confluence and the local DB.
        """
        try:
            self.confluence_repo.delete_page(page_id=page_id)
            
            # This will cascade and delete the Page record due to the relation
            await self.submission_repo.delete_by_confluence_id(page_id)
            
            return True
        except Exception as e:
            print(f"Error during permanent deletion of page {page_id}: {e}")
            raise HTTPException(status_code=503, detail="Failed to delete the page.")

    async def get_content_index_nodes(self, parent_id: Optional[str] = None) -> List[ContentNode]:
        """
        Fetches a hierarchical view of content, enriching Confluence data
        with local DB submission status.
        """
        nodes = []
        try:
            if parent_id is None:
                # Get root pages (Departments, Tools, etc.)
                page_stubs = self.confluence_repo.get_page_tree(None)
            else:
                # Get children of a specific page
                page_stubs = self.confluence_repo.get_page_tree(parent_id)
        except Exception as e:
            print(f"Error fetching page hierarchy for parent {parent_id}: {e}")
            raise HTTPException(status_code=503, detail="Could not fetch page hierarchy.")

        for stub in page_stubs:
            page_id = stub['id']
            try:
                # Get submission status and author from our local DB
                submission = await self.submission_repo.get_by_confluence_id_with_author(page_id)
                
                author_name, status = "System", ArticleSubmissionStatus.PUBLISHED
                if submission:
                    author_name = submission.author.name if submission.author else "Unknown"
                    status = submission.status
                
                nodes.append(ContentNode(
                    id=page_id,
                    title=stub['title'],
                    author=author_name,
                    status=status,
                    updatedAt=datetime.now(), # Note: This data is not available on stubs
                    confluenceUrl=f"{self.settings.confluence_url}/spaces/{self.settings.confluence_space_key}/pages/{page_id}",
                    children=[],
                    hasChildren=stub['hasChildren']
                ))
            except Exception as e:
                print(f"Error processing node for page {page_id}: {e}")
                
        return nodes

