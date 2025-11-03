# server/app/services/confluence_service.py
import re
import os
import time
import mimetypes
import requests
import json
from typing import List, Dict, Optional
from atlassian import Confluence
from bs4 import BeautifulSoup
from fastapi.responses import StreamingResponse
from fastapi import HTTPException, status # <-- ADDED IMPORTS
import io

from app.db import db
from app.schemas.cms_schemas import ArticleSubmissionStatus
from app.config import Settings
from app.schemas.content_schemas import Article, Tag, Subsection, GroupInfo, PageContentItem, Ancestor
from app.schemas.cms_schemas import PageCreate, AttachmentInfo, ContentNode
from app.utils.html_translator import html_to_storage_format
from app.broadcaster import broadcast

UPLOAD_DIR = "/tmp/uploads"

class ConfluenceService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.confluence = Confluence(
            url=self.settings.confluence_url,
            username=self.settings.confluence_username,
            password=self.settings.confluence_api_token,
            cloud=True
        )
        self.root_page_ids: Dict[str, str] = self._discover_root_pages()
        self.id_to_group_slug_map: Dict[str, str] = {v: k for k, v in self.root_page_ids.items()}
        if not self.root_page_ids:
            # In a real application, this should probably raise a critical startup error.
            print("CRITICAL: Could not discover any root page IDs. Confluence integration may fail.")

    async def _notify_all_admins(self, message: str, link: str):
        """
        Fetches all admins, saves a notification to the DB for each one,
        and pushes a real-time broadcast.
        """
        try:
            admins = await db.user.find_many(where={'role': 'ADMIN'})
            if not admins:
                return

            message_payload = json.dumps({
                "message": message,
                "link": link
            })
            
            notifications_to_create = []
            for admin in admins:
                notifications_to_create.append({
                    'message': message,
                    'link': link,
                    'recipientId': admin.id
                })
            
            if notifications_to_create:
                await db.notification.create_many(data=notifications_to_create)

            for admin in admins:
                await broadcast.push(admin.id, message_payload)

        except Exception as e:
            print(f"Error notifying admins: {e}")

    def _discover_root_pages(self) -> Dict[str, str]:
        space_key = self.settings.confluence_space_key
        discovered_ids = {}
        expected_titles = { "Department": "departments", "Resource Centre": "resource-centre", "Tools": "tools" }
        for title, slug in expected_titles.items():
            try:
                search_path = f'/rest/api/content?spaceKey={space_key}&title={title}&limit=1'
                results = self.confluence.get(search_path).get('results', [])
                if results and not results[0].get('parent'):
                    page_id = results[0]['id']
                    discovered_ids[slug] = page_id
            except Exception as e:
                # This is a critical error during startup, so we log it prominently.
                print(f"FATAL: Could not discover root page titled '{title}'. Error: {e}")
        return discovered_ids

    # ... (Helper methods like _slugify, _get_plain_text, _get_group_from_ancestors are fine) ...
    def _slugify(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r'[\s_&]+', '-', text)
        text = re.sub(r'[^\w\s-]', '', text)
        return text

    def _get_plain_text(self, html_content: str) -> str:
        if not html_content: return ""
        soup = BeautifulSoup(html_content, 'html.parser')
        return soup.get_text(" ", strip=True)
        
    def _get_group_from_ancestors(self, ancestors: List[Dict]) -> str:
        known_root_ids = self.id_to_group_slug_map.keys()
        for ancestor in ancestors:
            ancestor_id = ancestor.get('id')
            if ancestor_id in known_root_ids:
                return self.id_to_group_slug_map[ancestor_id]
        return ""

    def _transform_page_to_article(self, page_data: dict, is_admin_view: bool = False) -> Optional[Article]:
        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        label_names = {label.get("name") for label in raw_labels}
        
        if not is_admin_view:
            if "status-unpublished" in label_names or "status-rejected" in label_names:
                return None

        ancestors = page_data.get('ancestors', [])
        if not ancestors: return None

        group_slug = self._get_group_from_ancestors(ancestors)
        if not group_slug: return None
        
        subsection_slug = self._slugify(ancestors[-1]['title']) if ancestors else ""
        
        html_content = page_data.get("body", {}).get("view", {}).get("value", "")
        plain_text = self._get_plain_text(html_content)
        word_count = len(plain_text.split())
        read_minutes = max(1, round(word_count / 200))
        excerpt = (plain_text[:150] + '...') if len(plain_text) > 150 else plain_text
        
        status_labels = {"status-unpublished", "status-rejected"}
        tags = [Tag(id=label["id"], name=label["name"], slug=self._slugify(label["name"])) for label in raw_labels if label.get("name") not in status_labels]
        
        author_info = page_data.get("version", {}).get("by", {})
        author_name = author_info.get("displayName") if author_info else "Unknown"
        
        article_data = {
            "id": page_data["id"],
            "slug": self._slugify(page_data["title"]),
            "title": page_data["title"],
            "excerpt": excerpt,
            "html": html_content,
            "tags": tags,
            "group": group_slug,
            "subsection": subsection_slug,
            "updatedAt": page_data["version"]["when"],
            "views": 0,
            "readMinutes": read_minutes,
            "author": author_name
        }
        return Article.model_validate(article_data)

    def _transform_page_to_subsection(self, page_data: dict) -> Optional[Subsection]:
        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        label_names = {label.get("name") for label in raw_labels}

        if "status-unpublished" in label_names or "status-rejected" in label_names:
            return None

        ancestors = page_data.get('ancestors', [])
        if not ancestors: return None

        group_slug = self._get_group_from_ancestors(ancestors)
        if not group_slug: return None
        
        status_labels = {"status-unpublished", "status-rejected"}
        tags = [Tag(id=label["id"], name=label["name"], slug=self._slugify(label["name"])) for label in raw_labels if label.get("name") not in status_labels]

        html_content = page_data.get("body", {}).get("view", {}).get("value", "")
        plain_text = self._get_plain_text(html_content)
        description = (plain_text[:250] + '...') if len(plain_text) > 250 else plain_text
        
        try:
            cql = f'parent={page_data["id"]} and label != "status-unpublished" and label != "status-rejected"'
            count_results = self.confluence.cql(cql, limit=0)
            article_count = count_results.get('size', 0)
        except Exception as e:
            print(f"Could not efficiently count children for page {page_data['id']}: {e}")
            article_count = 0
        subsection_data = {
            "id": page_data["id"], 
            "slug": self._slugify(page_data["title"]), 
            "title": page_data["title"],
            "description": description or "No description available.", 
            "html": html_content, 
            "group": group_slug,
            "tags": tags, 
            "articleCount": article_count, 
            "updatedAt": page_data["version"]["when"],
        }
        return Subsection.model_validate(subsection_data)

    
    def _fetch_and_transform_articles_from_cql(self, cql: str, limit: int, is_admin_view: bool = False) -> List[Article]:
        try:
            search_path = f'/rest/api/content/search?cql={cql}&limit={limit}&expand=body.view,version,metadata.labels,ancestors'
            results = self.confluence.get(search_path).get('results', [])
            articles = []
            for page_data in results:
                transformed_article = self._transform_page_to_article(page_data, is_admin_view=is_admin_view)
                if transformed_article:
                    articles.append(transformed_article)
            return articles
        except Exception as e:
            print(f"Error during CQL fetch and transform: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Failed to search content from Confluence."
            )
    
    def get_groups(self) -> List[GroupInfo]:
        return [
            GroupInfo(id='departments', title='Departments', description='Resources organized by team functions', icon='Building2'),
            GroupInfo(id='resource-centre', title='Resource Centre', description='Comprehensive knowledge base and docs', icon='BookOpen'),
            GroupInfo(id='tools', title='Tools', description='Development tools, utilities, and guides', icon='Wrench'),
        ]
        
    def get_subsections_by_group(self, group_slug: str) -> List[Subsection]:
        root_page_id = self.root_page_ids.get(group_slug)
        if not root_page_id: 
            return []
        try:
            child_pages_stubs = list(self.confluence.get_child_pages(root_page_id))
            subsections = []
            for stub in child_pages_stubs:
                page_details = self.confluence.get_page_by_id(stub['id'], expand="version,metadata.labels,body.view,ancestors")
                if page_details:
                    transformed_subsection = self._transform_page_to_subsection(page_details)
                    if transformed_subsection:
                        subsections.append(transformed_subsection)
            return subsections
        except Exception as e:
            print(f"Could not fetch subsections for group '{group_slug}': {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not fetch data for group '{group_slug}' from Confluence."
            )
    
    def get_article_by_id(self, page_id: str) -> Optional[Article]:
        try:
            article_page = self.confluence.get_page_by_id(page_id, expand="body.view,version,metadata.labels,ancestors")
            if not article_page:
                return None # The endpoint will handle the 404
            return self._transform_page_to_article(article_page)
        except Exception as e:
            print(f"Error fetching article ID {page_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not fetch article {page_id} from Confluence."
            )
    
    def get_article_for_preview(self, page_id: str) -> Optional[Article]:
        try:
            article_page = self.confluence.get_page_by_id(page_id, expand="body.view,version,metadata.labels,ancestors")
            if not article_page:
                return None
            return self._transform_page_to_article(article_page, is_admin_view=True)
        except Exception as e:
            print(f"Error fetching article preview for ID {page_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not fetch preview for article {page_id}."
            )

    def get_page_by_id(self, page_id: str) -> Optional[Subsection]:
        try:
            page_data = self.confluence.get_page_by_id(page_id, expand="version,metadata.labels,body.view,ancestors")
            if not page_data:
                return None
            return self._transform_page_to_subsection(page_data)
        except Exception as e:
            print(f"Error fetching page ID {page_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not fetch page {page_id} from Confluence."
            )

    def get_page_contents(self, parent_page_id: str) -> List[PageContentItem]:
        try:
            cql = f'parent={parent_page_id} and label != "status-unpublished" and label != "status-rejected"'
            results = self.confluence.cql(cql, limit=200, expand="body.view,version,metadata.labels,ancestors").get('results', [])
            content_items = []
            for page_summary in results:
                page_id = page_summary['content']['id']
                page = self.confluence.get_page_by_id(page_id, expand="body.view,version,metadata.labels,ancestors")
                if not page: continue
                grand_children_cql = f'parent={page_id} and label != "status-unpublished" and label != "status-rejected"'
                grand_children_results = self.confluence.cql(grand_children_cql, limit=1).get('results', [])
                if len(grand_children_results) > 0:
                    subsection = self._transform_page_to_subsection(page)
                    if subsection: content_items.append(subsection)
                else:
                    article = self._transform_page_to_article(page)
                    if article: content_items.append(article)
            return content_items
        except Exception as e:
            print(f"Error in get_page_contents for parent {parent_page_id}: {e}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Could not fetch contents for page {parent_page_id}."
            )
    
    def get_ancestors(self, page_id: str) -> List[Ancestor]:
        try:
            ancestors_data = self.confluence.get_page_ancestors(page_id)
            return [Ancestor(id=a['id'], title=a['title']) for a in ancestors_data]
        except Exception as e:
            print(f"Error fetching ancestors for page ID {page_id}: {e}")
            # Return an empty list but don't crash the server. This is less critical.
            return []

    def get_page_tree(self, parent_id: Optional[str] = None) -> List[Dict]:
        nodes = []
        try:
            if parent_id is None:
                for slug, page_id in self.root_page_ids.items():
                    cql = f'parent={page_id}'
                    children_results = self.confluence.cql(cql, limit=1).get('results', [])
                    page = self.confluence.get_page_by_id(page_id)
                    nodes.append({
                        "id": page['id'], "title": page['title'], "hasChildren": len(children_results) > 0
                    })
            else:
                child_pages = self.confluence.get_child_pages(parent_id)
                for child in child_pages:
                    grand_children_cql = f'parent={child["id"]}'
                    grand_children_results = self.confluence.cql(grand_children_cql, limit=1).get('results', [])
                    nodes.append({
                        "id": child['id'], "title": child['title'], "hasChildren": len(grand_children_results) > 0
                    })
            return nodes
        except Exception as e:
            print(f"Error fetching page tree for parent {parent_id}: {e}")
            raise HTTPException(status_code=503, detail="Could not fetch page hierarchy.")
    

    async def get_page_contents_from_db(self, parent_confluence_id: str, page: int, page_size: int) -> dict:
        """
        NEW: Fetches paginated contents (children) of a given parent page directly from the local database.
        """
        skip = (page - 1) * page_size
        
        # Query for the children of the parent
        child_pages = await db.page.find_many(
            where={'parentConfluenceId': parent_confluence_id},
            include={'tags': True},
            skip=skip,
            take=page_size,
            order={'title': 'asc'}
        )
        
        total_items = await db.page.count(where={'parentConfluenceId': parent_confluence_id})
        
        return {
            "items": child_pages,
            "total": total_items,
            "page": page,
            "pageSize": page_size,
            "hasNext": (skip + len(child_pages)) < total_items
        }

    async def get_article_by_id_hybrid(self, page_id: str) -> Optional[dict]:
        """
        NEW HYBRID MODEL: Fetches metadata from local DB and content from Confluence.
        """
        # Step 1: Fetch metadata from our fast local DB
        page_metadata = await db.page.find_unique(
            where={'confluenceId': page_id},
            include={'tags': True}
        )

        if not page_metadata:
            return None

        # Step 2: Fetch only the heavy HTML content from Confluence
        try:
            page_content_data = self.confluence.get_page_by_id(page_id, expand="body.view")
            html_content = page_content_data.get("body", {}).get("view", {}).get("value", "")
        except Exception as e:
            print(f"CRITICAL: Could not fetch content for page {page_id} from Confluence, but metadata exists. Error: {e}")
            html_content = "<p>Error: Could not load document content from the source.</p>"
        
        # Step 3: Merge the two data sources into a single response object
        # Note: We are now returning a dictionary, not a Pydantic model, to easily merge them.
        # The endpoint's response_model will handle validation.
        merged_data = {
            "id": page_metadata.confluenceId,
            "slug": page_metadata.slug,
            "title": page_metadata.title,
            "excerpt": page_metadata.description, # Using our DB description as the excerpt
            "description": page_metadata.description,
            "html": html_content,
            "tags": page_metadata.tags,
            "author": page_metadata.authorName,
            "updatedAt": page_metadata.updatedAt.isoformat(),
            "views": page_metadata.views,
            "readMinutes": page_metadata.readMinutes,
            # These fields might need to be backfilled or derived differently
            "group": "unknown", 
            "subsection": "unknown",
        }
        return merged_data

    async def search_content_hybrid(self, query: str, page: int, page_size: int) -> dict:
        """
        NEW HYBRID SEARCH: Searches Confluence for IDs, then enriches with local DB metadata.
        """
        # Step 1: Search Confluence but only ask for IDs and titles to keep it fast.
        # Note: Confluence's CQL search is not case-sensitive.
        cql = f'space = "{self.settings.confluence_space_key}" and text ~ "{query}" and label != "status-unpublished" and label != "status-rejected"'
        
        # We fetch one extra to see if there is a next page.
        limit = page_size + 1
        start = (page - 1) * page_size
        
        try:
            search_results = self.confluence.cql(cql, start=start, limit=limit, expand="title").get('results', [])
        except Exception as e:
            print(f"Error searching Confluence: {e}")
            raise HTTPException(status_code=503, detail="Search service is currently unavailable.")

        has_next_page = len(search_results) > page_size
        # Trim the extra item if it exists
        if has_next_page:
            search_results = search_results[:-1]
            
        confluence_ids = [result['content']['id'] for result in search_results]

        if not confluence_ids:
            return {"items": [], "hasNext": False, "total": 0}

        # Step 2: Enrich these IDs with a single query to our fast local database.
        enriched_pages = await db.page.find_many(
            where={'confluenceId': {'in': confluence_ids}},
            include={'tags': True}
        )

        # Optional: Re-order the DB results to match the relevance order from Confluence search
        enriched_map = {page.confluenceId: page for page in enriched_pages}
        ordered_enriched_pages = [enriched_map[cid] for cid in confluence_ids if cid in enriched_map]

        return {
            "items": ordered_enriched_pages,
            "hasNext": has_next_page,
            # Note: Total is not easily available from CQL, so we omit it for now for performance.
            "total": -1 # Indicates that total count is not available
        }

    def get_attachment_data(self, page_id: str, file_name: str) -> Optional[StreamingResponse]:
        try:
            attachments = self.confluence.get_attachments_from_content(page_id=page_id, limit=200)
            target_attachment = next((att for att in attachments['results'] if att['title'] == file_name), None)
            if not target_attachment:
                raise HTTPException(status_code=404, detail="Attachment not found.")
            
            download_link = self.settings.confluence_url + target_attachment['_links']['download']
            response = self.confluence.session.get(download_link, stream=True)
            response.raise_for_status()
            
            mimetype, _ = mimetypes.guess_type(file_name)
            media_type = mimetype or 'application/octet-stream'
            return StreamingResponse(response.iter_content(chunk_size=8192), media_type=media_type)
        except Exception as e:
            print(f"Error fetching attachment '{file_name}' for page ID {page_id}: {e}")
            # Raise a 404 if not found, 503 for other connection errors
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=503, detail="Could not retrieve attachment from Confluence.")

    # All public methods below are already covered by the _fetch_and_transform_articles_from_cql wrapper
    def get_recent_articles(self, limit: int = 6) -> List[Article]:
        cql = f'space = "{self.settings.confluence_space_key}" and type = page and label != "status-unpublished" and label != "status-rejected" order by lastModified desc'
        return self._fetch_and_transform_articles_from_cql(cql, limit)

    def get_popular_articles(self, limit: int = 6) -> List[Article]:
        cql = f'space = "{self.settings.confluence_space_key}" and type = page and label != "status-unpublished" and label != "status-rejected" order by created desc'
        return self._fetch_and_transform_articles_from_cql(cql, limit)

    def get_whats_new(self, limit: int = 20) -> List[Article]:
        return self.get_recent_articles(limit)
    
    def get_all_tags(self) -> List[Tag]:
        try:
            path = f'/rest/api/space/{self.settings.confluence_space_key}/label'
            labels_data = self.confluence.get(path, params={'limit': 200}).get('results', [])
            tags = [Tag(id=label["id"], name=label["name"], slug=self._slugify(label["name"])) for label in labels_data]
            unique_tags = {tag.name: tag for tag in tags}.values()
            return sorted(list(unique_tags), key=lambda t: t.name)
        except Exception as e:
            print(f"Error fetching all tags: {e}")
            raise HTTPException(status_code=503, detail="Could not fetch tags from Confluence.")

    def search_content(self, query: str, labels: List[str] = None, mode: str = "all") -> List[Article]:
        cql_parts = [ f'space = "{self.settings.confluence_space_key}"', 'type = page', 'label != "status-unpublished"', 'label != "status-rejected"']
        if mode == "tags":
            tag_list = query.strip().split()
            if not tag_list: return []
            label_clauses = [f'label = "{tag}"' for tag in tag_list]
            cql_parts.extend(label_clauses)
        elif mode == "title":
            cql_parts.append(f'title ~ "{query}"')
        else:
            cql_parts.append(f'text ~ "{query}"')
        if labels:
            cql_parts.extend([f'label = "{l}"' for l in labels])
        cql = ' and '.join(cql_parts) + ' order by lastModified desc'
        return self._fetch_and_transform_articles_from_cql(cql, 50)
        
    def _add_label_to_page(self, page_id: str, label_name: str):
        self.confluence.set_page_label(page_id, label_name)
    
    def _remove_label_from_page(self, page_id: str, label_name: str):
        self.confluence.remove_page_label(page_id, label_name)
    
    def _post_comment_to_page(self, page_id: str, comment_text: str):
        self.confluence.add_comment(page_id=page_id, text=comment_text)

    # In server/app/services/confluence_service.py

    async def create_page_for_review(self, page_data: PageCreate, author_id: int, author_name: str) -> dict:
        """
        Creates a page in Confluence, then saves its metadata to the local database.
        Follows the "Confluence first, then DB" pattern.
        """
        page_id = None
        try:
            # Step 1: Create the page in Confluence
            translated_content = html_to_storage_format(page_data.content)
            full_content = f"<p><em>Submitted by: {author_name}</em></p>{translated_content}"
            
            new_page_in_confluence = self.confluence.create_page(
                space=self.settings.confluence_space_key,
                title=page_data.title,
                parent_id=page_data.parent_id,
                body=full_content,
                representation='storage'
            )

            if not new_page_in_confluence:
                raise Exception("Page creation in Confluence returned a null response.")
            
            page_id = new_page_in_confluence['id']
            updated_at = new_page_in_confluence['version']['when']

            # Step 2: Create the Page metadata record in our DB. This must be done
            # before creating the ArticleSubmission due to the schema relation.
            
            # Upsert tags and get their IDs for connection
            tag_connect_ops = []
            for tag_name in page_data.tags:
                slug = self._slugify(tag_name)
                tag = await db.tag.upsert(
                    where={'name': tag_name},
                    data={
                        'create': {'name': tag_name, 'slug': slug},
                        'update': {'slug': slug}
                    }
                )
                tag_connect_ops.append({'id': tag.id})

            # Create the Page record
            await db.page.create(data={
                'confluenceId': page_id,
                'title': page_data.title,
                'slug': self._slugify(page_data.title),
                'description': page_data.description,
                'pageType': 'ARTICLE', # New pages are always articles
                'parentConfluenceId': page_data.parent_id,
                'authorName': author_name,
                'updatedAt': updated_at,
                'tags': {'connect': tag_connect_ops}
            })
            
            # Step 3: Create the ArticleSubmission record, which links to the new Page record
            await db.articlesubmission.create(data={
                'confluencePageId': page_id, # This creates the relation to the Page
                'title': page_data.title,
                'authorId': author_id,
                'status': ArticleSubmissionStatus.PENDING_REVIEW
            })

            # Step 4: Handle Attachments and Labels in Confluence
            time.sleep(1) # Give Confluence a moment to process the new page
            
            attachment_url = f"{self.settings.confluence_url}/rest/api/content/{page_id}/child/attachment"
            headers = {"X-Atlassian-Token": "no-check"}
            for attachment in page_data.attachments:
                temp_file_path = os.path.join(UPLOAD_DIR, attachment.temp_id)
                if os.path.exists(temp_file_path):
                    try:
                        content_type, _ = mimetypes.guess_type(attachment.file_name)
                        content_type = content_type or 'application/octet-stream'
                        with open(temp_file_path, 'rb') as file_handle:
                            files = {'file': (attachment.file_name, file_handle, content_type)}
                            response = self.confluence.session.post(attachment_url, headers=headers, files=files)
                            response.raise_for_status()
                    finally:
                        os.remove(temp_file_path)
            
            self._add_label_to_page(page_id, 'status-unpublished')
            for tag in page_data.tags:
                self._add_label_to_page(page_id, tag)

            # Step 5: Notify admins
            await self._notify_all_admins(
                message=f"New article '{page_data.title}' submitted by {author_name} is pending review.",
                link="/admin/dashboard"
            )
                
            return {"id": page_id, "title": page_data.title, "status": "unpublished"}

        except Exception as e:
            print(f"Failed to create page for review: {e}")
            if page_id:
                try:
                    self.confluence.remove_page(page_id, status='draft')
                    print(f"Cleaned up draft page {page_id} in Confluence after DB error.")
                except Exception as cleanup_e:
                    print(f"Failed to clean up draft page {page_id}: {cleanup_e}")
            raise HTTPException(status_code=503, detail="Failed to create page.")
    
    async def get_pending_submissions_from_db(self) -> List[Article]:
        pending_submissions = await db.articlesubmission.find_many(where={'status': ArticleSubmissionStatus.PENDING_REVIEW}, include={'author': True}, order={'updatedAt': 'desc'})
        return [Article.model_validate({"id": sub.confluencePageId, "title": sub.title, "author": sub.author.name if sub.author else "Unknown", "updatedAt": sub.updatedAt.isoformat(), "slug": self._slugify(sub.title), "excerpt": "Content available for preview.", "html": "", "tags": [], "group": "unknown", "subsection": "unknown", "views": 0, "readMinutes": 0}) for sub in pending_submissions]


    async def approve_page(self, page_id: str) -> bool:
        """
        Approves a page by updating its labels in Confluence and syncing the
        latest metadata back to the local database.
        """
        try:
            # Step 1: Update labels in Confluence to make the page public
            self._remove_label_from_page(page_id, "status-unpublished")
            self._remove_label_from_page(page_id, "status-rejected") # Also remove rejected just in case

            # Step 2: Fetch the latest, now public, page data from Confluence for syncing
            page_data = self.confluence.get_page_by_id(
                page_id, expand="body.view,version,metadata.labels"
            )
            if not page_data:
                raise HTTPException(status_code=404, detail="Page not found in Confluence after attempting approval.")

            # Step 3: Extract metadata from the fresh Confluence data
            title = page_data["title"]
            author_name = page_data.get("version", {}).get("by", {}).get("displayName", "Unknown")
            updated_at = page_data["version"]["when"]
            html_content = page_data.get("body", {}).get("view", {}).get("value", "")
            plain_text = BeautifulSoup(html_content, 'html.parser').get_text(" ", strip=True)
            description = (plain_text[:250] + '...') if len(plain_text) > 250 else "No description available."
            
            # Determine Page Type
            children_response = self.confluence.get_child_pages(page_id, limit=1)
            page_type = "SUBSECTION" if list(children_response) else "ARTICLE"
            
            # Process and upsert Tags
            tag_ops = []
            raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
            for label in raw_labels:
                tag_name = label["name"]
                if not tag_name.startswith("status-"):
                    slug = self._slugify(tag_name)
                    tag = await db.tag.upsert(
                        where={'name': tag_name},
                        data={'create': {'name': tag_name, 'slug': slug}, 'update': {'slug': slug}}
                    )
                    tag_ops.append({'id': tag.id})
            
            # Step 4: Sync the latest metadata to our local Page record
            await db.page.update(
                where={'confluenceId': page_id},
                data={
                    'title': title,
                    'slug': self._slugify(title),
                    'description': description,
                    'pageType': page_type,
                    'authorName': author_name,
                    'updatedAt': updated_at,
                    'tags': {'set': tag_ops} # Use 'set' to ensure tags are perfectly in sync
                }
            )

            # Step 5: Update the submission status and notify the author
            submission = await db.articlesubmission.update(
                where={'confluencePageId': page_id},
                data={'status': ArticleSubmissionStatus.PUBLISHED}
            )
            if submission:
                message = f"Your article '{submission.title}' has been approved and published."
                link = f"/article/{page_id}"
                await db.notification.create(data={'message': message, 'link': link, 'recipientId': submission.authorId})
                await broadcast.push(user_id=submission.authorId, message=json.dumps({"message": message, "link": link}))
            
            return True
        except Exception as e:
            print(f"Error approving page {page_id}: {e}")
            # Attempt to roll back by re-adding the unpublished label
            try:
                self._add_label_to_page(page_id, "status-unpublished")
            except Exception as rollback_e:
                print(f"Error during rollback of approval for page {page_id}: {rollback_e}")
            raise HTTPException(status_code=503, detail=f"Failed to approve and sync page {page_id}.")
    
    # In server/app/services/confluence_service.py

    async def update_page(self, page_id: str, page_data: PageUpdate) -> bool:
        """
        Updates a page's title and content in Confluence, and syncs the
        title, slug, and description to the local database.
        """
        try:
            # Step 1: Update the page in Confluence
            translated_content = html_to_storage_format(page_data.content)
            
            # To update a page, we need its current version number
            current_page = self.confluence.get_page_by_id(page_id, expand="version")
            if not current_page:
                raise HTTPException(status_code=404, detail="Page to update not found in Confluence.")
            
            # The update call implicitly increments the version number.
            self.confluence.update_page(
                page_id=page_id,
                title=page_data.title,
                body=translated_content,
                parent_id=None, # We are not changing the parent
                version_comment="Content updated via Knowledge Hub portal",
                representation='storage'
            )

            # Step 2: Fetch the latest version info after update for sync
            updated_page_data = self.confluence.get_page_by_id(page_id, expand="version")
            updated_at = updated_page_data["version"]["when"]

            # Step 3: Update the local Page record with new metadata
            await db.page.update(
                where={'confluenceId': page_id},
                data={
                    'title': page_data.title,
                    'slug': self._slugify(page_data.title),
                    'description': page_data.description,
                    'updatedAt': updated_at,
                }
            )

            # Step 4: Also update the submission record's title to keep it in sync
            await db.articlesubmission.update(
                where={'confluencePageId': page_id},
                data={'title': page_data.title}
            )

            return True
        except Exception as e:
            print(f"Error updating page {page_id}: {e}")
            raise HTTPException(status_code=503, detail=f"Failed to update page {page_id} in Confluence or DB.")

    async def reject_page(self, page_id: str, comment: Optional[str] = None) -> bool:
        try:
            if comment: self._post_comment_to_page(page_id, comment)
            self._remove_label_from_page(page_id, "status-unpublished")
            self._add_label_to_page(page_id, "status-rejected")
            submission = await db.articlesubmission.update(where={'confluencePageId': page_id}, data={'status': ArticleSubmissionStatus.REJECTED})
            if submission:
                message = f"Your article '{submission.title}' was rejected. See comments for feedback."
                link = "/my-submissions"
                await db.notification.create(data={'message': message, 'link': link, 'recipientId': submission.authorId})
                await broadcast.push(user_id=submission.authorId, message=json.dumps({"message": message, "link": link}))
            return True
        except Exception as e:
            print(f"Error rejecting page {page_id}: {e}")
            raise HTTPException(status_code=503, detail=f"Failed to reject page {page_id} in Confluence.")

    async def get_content_index_nodes(self, parent_id: Optional[str] = None) -> List[ContentNode]:
        nodes, page_ids_to_fetch = [], []
        try:
            if parent_id is None:
                page_ids_to_fetch = list(self.root_page_ids.values())
            else:
                child_pages = self.confluence.get_child_pages(parent_id)
                page_ids_to_fetch = [child['id'] for child in child_pages]
        except Exception as e:
            print(f"Error fetching page hierarchy for parent {parent_id}: {e}")
            raise HTTPException(status_code=503, detail="Could not fetch page hierarchy from Confluence.")

        for page_id in page_ids_to_fetch:
            try:
                page_details = self.confluence.get_page_by_id(page_id, expand="version")
                if not page_details: continue

                grand_children_results = self.confluence.cql(f'parent={page_id}', limit=1).get('results', [])
                has_children = len(grand_children_results) > 0
                
                submission = await db.articlesubmission.find_unique(where={'confluencePageId': page_id})
                author_name, status = "System", ArticleSubmissionStatus.PUBLISHED
                if submission:
                    author = await db.user.find_unique(where={'id': submission.authorId})
                    if author: author_name = author.name
                    status = submission.status
                
                nodes.append(ContentNode(id=page_id, title=page_details['title'], author=author_name, status=status, updatedAt=page_details['version']['when'], confluenceUrl=f"{self.settings.confluence_url}/spaces/{self.settings.confluence_space_key}/pages/{page_id}", children=[], hasChildren=has_children))
            except Exception as e:
                print(f"Error processing node for page {page_id}: {e}")
                # Continue processing other nodes even if one fails
        return nodes

    async def get_submissions_by_author(self, author_id: int) -> List[dict]:
        submissions = await db.articlesubmission.find_many(where={'authorId': author_id}, order={'updatedAt': 'desc'})
        return [sub.model_dump() for sub in submissions]
    
    async def resubmit_page_for_review(self, page_id: str) -> bool:
        try:
            self._remove_label_from_page(page_id, "status-rejected")
            self._add_label_to_page(page_id, "status-unpublished")
            submission = await db.articlesubmission.update(where={'confluencePageId': page_id}, data={'status': ArticleSubmissionStatus.PENDING_REVIEW})
            if submission:
                author = await db.user.find_unique(where={'id': submission.authorId})
                author_name = author.name if author else "A user"
                await self._notify_all_admins(message=f"Article '{submission.title}' was resubmitted by {author_name} and is pending review.", link="/admin/dashboard")
            return True
        except Exception as e:
            print(f"Error resubmitting page {page_id}: {e}")
            raise HTTPException(status_code=503, detail=f"Failed to resubmit page {page_id} in Confluence.")
    
    async def delete_page_permanently(self, page_id: str) -> bool:
        try:
            self.confluence.remove_page(page_id=page_id)
            submission = await db.articlesubmission.find_unique(where={'confluencePageId': page_id})
            if submission:
                await db.articlesubmission.delete(where={'confluencePageId': page_id})
            return True
        except Exception as e:
            print(f"Error during permanent deletion of page {page_id}: {e}")
            raise HTTPException(status_code=503, detail="Failed to delete the page.")