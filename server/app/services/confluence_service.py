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
            print("CRITICAL: Could not discover any root page IDs.")

    # --- THIS IS THE CORRECTED FUNCTION ---
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
            
            # Prepare notification data for all admins
            notifications_to_create = []
            for admin in admins:
                notifications_to_create.append({
                    'message': message,
                    'link': link,
                    'recipientId': admin.id
                })
            
            # 1. Save all notifications to the database in one go
            await db.notification.create_many(data=notifications_to_create)

            # 2. Push the real-time event to all connected admins
            for admin in admins:
                await broadcast.push(admin.id, message_payload)

        except Exception as e:
            print(f"Error notifying admins: {e}")
    # --- END OF CORRECTED FUNCTION ---

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
                print(f"Error searching for page titled '{title}': {e}")
        return discovered_ids

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
        
        child_pages_generator = self.confluence.get_child_pages(page_data['id'])
        article_count = len(list(child_pages_generator))
      
        subsection_data = {
            "id": page_data["id"], "slug": self._slugify(page_data["title"]), "title": page_data["title"],
            "description": description or "No description available.", "html": html_content, "group": group_slug,
            "tags": tags, "articleCount": article_count, "updatedAt": page_data["version"]["when"],
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
            return []
    
    
    def get_groups(self) -> List[GroupInfo]:
        return [
            GroupInfo(id='departments', title='Departments', description='Resources organized by team functions', icon='Building2'),
            GroupInfo(id='resource-centre', title='Resource Centre', description='Comprehensive knowledge base and docs', icon='BookOpen'),
            GroupInfo(id='tools', title='Tools', description='Development tools, utilities, and guides', icon='Wrench'),
        ]
        
    def get_subsections_by_group(self, group_slug: str) -> List[Subsection]:
        root_page_id = self.root_page_ids.get(group_slug)
        if not root_page_id: return []
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
            return []
    
    def get_article_by_id(self, page_id: str) -> Optional[Article]:
        try:
            article_page = self.confluence.get_page_by_id(page_id, expand="body.view,version,metadata.labels,ancestors")
            if not article_page:
                return None
            return self._transform_page_to_article(article_page)
        except Exception as e:
            print(f"Error fetching article ID {page_id}: {e}")
            return None
    
    def get_article_for_preview(self, page_id: str) -> Optional[Article]:
        """ Fetches an article by its ID without status checks, for admin previews.
        """
        try:
            article_page = self.confluence.get_page_by_id(page_id, expand="body.view,version,metadata.labels,ancestors")
            if not article_page:
                return None
            return self._transform_page_to_article(article_page, is_admin_view=True)
        except Exception as e:
            print(f"Error fetching article preview for ID {page_id}: {e}")
            return None

    def get_page_by_id(self, page_id: str) -> Optional[Subsection]:
        try:
            page_data = self.confluence.get_page_by_id(page_id, expand="version,metadata.labels,body.view,ancestors")
            if not page_data:
                return None
            return self._transform_page_to_subsection(page_data)
        except Exception as e:
            print(f"Error fetching page ID {page_id}: {e}")
            return None

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
            return []
    
    
    def get_ancestors(self, page_id: str) -> List[Ancestor]:
        try:
            ancestors_data = self.confluence.get_page_ancestors(page_id)
            return [Ancestor(id=a['id'], title=a['title']) for a in ancestors_data]
        except Exception as e:
            print(f"Error fetching ancestors for page ID {page_id}: {e}")
            return []

    def get_page_tree(self, parent_id: Optional[str] = None) -> List[Dict]:
        nodes = []
        if parent_id is None:
            for slug, page_id in self.root_page_ids.items():
                try:
                    cql = f'parent={page_id}'
                    children_results = self.confluence.cql(cql, limit=1).get('results', [])
                    page = self.confluence.get_page_by_id(page_id)
                    nodes.append({
                        "id": page['id'],
                        "title": page['title'],
                        "hasChildren": len(children_results) > 0
                    })
                except Exception as e:
                    print(f"Error fetching root page {slug}: {e}")
            return nodes
        else:
            try:
                child_pages = self.confluence.get_child_pages(parent_id)
                for child in child_pages:
                    grand_children_cql = f'parent={child["id"]}'
                    grand_children_results = self.confluence.cql(grand_children_cql, limit=1).get('results', [])
                    nodes.append({
                        "id": child['id'],
                        "title": child['title'],
                        "hasChildren": len(grand_children_results) > 0
                    })
                return nodes
            except Exception as e:
                print(f"Error fetching children for page {parent_id}: {e}")
                return []

    def get_attachment_data(self, page_id: str, file_name: str) -> Optional[StreamingResponse]:
        try:
            attachments = self.confluence.get_attachments_from_content(page_id=page_id, limit=200)
            target_attachment = next((att for att in attachments['results'] if att['title'] == file_name), None)
            if not target_attachment: return None
            download_link = self.settings.confluence_url + target_attachment['_links']['download']
            response = self.confluence.session.get(download_link, stream=True)
            response.raise_for_status()
            mimetype, _ = mimetypes.guess_type(file_name)
            media_type = mimetype or 'application/octet-stream'
            return StreamingResponse(response.iter_content(chunk_size=8192), media_type=media_type)
        except Exception as e:
            print(f"Error fetching attachment '{file_name}' for page ID {page_id}: {e}")
            return None
         
    
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
            return []

    def search_content(self, query: str, labels: List[str] = None, mode: str = "all") -> List[Article]:
        cql_parts = [
            f'space = "{self.settings.confluence_space_key}"', 'type = page',
            'label != "status-unpublished"', 'label != "status-rejected"'
        ]
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
            label_clauses_from_param = [f'label = "{l}"' for l in labels]
            cql_parts.extend(label_clauses_from_param)
        cql = ' and '.join(cql_parts) + ' order by lastModified desc'
        return self._fetch_and_transform_articles_from_cql(cql, 50)
        
    def _add_label_to_page(self, page_id: str, label_name: str):
        self.confluence.set_page_label(page_id, label_name)
    
    def _remove_label_from_page(self, page_id: str, label_name: str):
        self.confluence.remove_page_label(page_id, label_name)
    
    def _post_comment_to_page(self, page_id: str, comment_text: str):
        """Posts a footer comment to a specific Confluence page using the dedicated library function."""
        try:
            # The library handles the formatting. We just provide the text.
            # This is a more reliable method than manual requests.
            self.confluence.add_comment(page_id=page_id, text=comment_text)
            
            print(f"Successfully posted comment to page {page_id}")
        except Exception as e:
            # This will give us a more specific library error if it fails
            print(f"Error posting comment to page {page_id} using atlassian-python-api: {e}")

    async def create_page_for_review(self, page_data: PageCreate, author_id: int, author_name: str) -> dict:
        try:
            translated_content = html_to_storage_format(page_data.content)
            full_content = f"<p><em>Submitted by: {author_name}</em></p>{translated_content}"
            new_page = self.confluence.create_page(space=self.settings.confluence_space_key, title=page_data.title, parent_id=page_data.parent_id, body=full_content, representation='storage')
            if not new_page: raise Exception("Page creation returned None.")
            page_id = new_page['id']
            
            
            db_submission = await db.articlesubmission.create(
                data={
                    'confluencePageId': page_id,
                    'title': page_data.title,
                    'authorId': author_id,
                    'status': ArticleSubmissionStatus.PENDING_REVIEW,
                }
            )

            # --- NOTIFICATION FOR ADMINS ---
            await self._notify_all_admins(
                message=f"New article '{page_data.title}' submitted by {author_name} is pending review.",
                link="/admin/dashboard"
            )
            # --- END NOTIFICATION ---

            time.sleep(5)
            attachment_url = f"{self.settings.confluence_url}/rest/api/content/{page_id}/child/attachment"
            headers = {"X-Atlassian-Token": "no-check"}
            for attachment in page_data.attachments:
                temp_file_path = os.path.join(UPLOAD_DIR, attachment.temp_id)
                if os.path.exists(temp_file_path):
                    try:
                        content_type, _ = mimetypes.guess_type(attachment.file_name)
                        if content_type is None: content_type = 'application/octet-stream'
                        with open(temp_file_path, 'rb') as file_handle:
                            files = {'file': (attachment.file_name, file_handle, content_type)}
                            response = requests.post(attachment_url, headers=headers, files=files, auth=(self.settings.confluence_username, self.settings.confluence_api_token))
                            response.raise_for_status()
                    finally:
                        os.remove(temp_file_path)

            self._add_label_to_page(page_id, 'status-unpublished')
            for tag in page_data.tags:
                self._add_label_to_page(page_id, tag)
            return {"id": page_id, "title": page_data.title, "status": "unpublished"}
        except Exception as e:
            raise e
    
    def get_pending_pages(self, limit: int = 50) -> List[Article]:
        cql = f'space = "{self.settings.confluence_space_key}" and type = page and label = "status-unpublished" order by created desc'
        return self._fetch_and_transform_articles_from_cql(cql, limit, is_admin_view=True)

    async def get_pending_submissions_from_db(self) -> List[Article]:
        """
        Fetches pending articles by querying the local ArticleSubmission database table.
        This is the new, preferred method for the admin dashboard.
        """
        try:
            pending_submissions = await db.articlesubmission.find_many(
                where={'status': ArticleSubmissionStatus.PENDING_REVIEW},
                include={'author': True},
                order={'updatedAt': 'desc'}
            )

            articles_for_dashboard = []
            for sub in pending_submissions:
                article_data = {
                    "id": sub.confluencePageId,
                    "title": sub.title,
                    "author": sub.author.name if sub.author else "Unknown",
                    "updatedAt": sub.updatedAt.isoformat(),
                    "slug": self._slugify(sub.title),
                    "excerpt": "Content available for preview.",
                    "html": "",
                    "tags": [],
                    "group": "unknown",
                    "subsection": "unknown",
                    "views": 0,
                    "readMinutes": 0,
                }
                articles_for_dashboard.append(Article.model_validate(article_data))

            return articles_for_dashboard
        except Exception as e:
            print(f"Error fetching pending submissions from DB: {e}")
            return []

    async def approve_page(self, page_id: str) -> bool:
        try:
            self._remove_label_from_page(page_id, "status-unpublished")
            submission = await db.articlesubmission.update(
                where={'confluencePageId': page_id},
                data={'status': ArticleSubmissionStatus.PUBLISHED}
            )
            
            # --- NOTIFICATION FOR AUTHOR ---
            if submission:
                message_payload = json.dumps({
                    "message": f"Your article '{submission.title}' has been approved and published.",
                    "link": f"/article/{page_id}"
                })
                # 1. Save to DB
                await db.notification.create(data={
                    'message': f"Your article '{submission.title}' has been approved and published.",
                    'link': f"/article/{page_id}",
                    'recipientId': submission.authorId
                })
                # 2. Push real-time
                await broadcast.push(
                    user_id=submission.authorId,
                    message=message_payload
                )
            # --- END NOTIFICATION ---

            return True
        except Exception as e:
            print(f"Error approving page {page_id}: {e}")
            return False
    
    async def reject_page(self, page_id: str, comment: Optional[str] = None) -> bool:
        try:
            # Step 1: Post the comment to Confluence if it exists
            if comment:
                self._post_comment_to_page(page_id, comment)

            # Step 2: Change the labels in Confluence
            self._remove_label_from_page(page_id, "status-unpublished")
            self._add_label_to_page(page_id, "status-rejected")
            
            # Step 3: Update the status in our database
            submission = await db.articlesubmission.update(
                where={'confluencePageId': page_id},
                data={'status': ArticleSubmissionStatus.REJECTED}
            )

            # --- NOTIFICATION FOR AUTHOR ---
            if submission:
                message_payload = json.dumps({
                    "message": f"Your article '{submission.title}' was rejected. See comments for feedback.",
                    "link": "/my-submissions"
                })
                # 1. Save to DB
                await db.notification.create(data={
                    'message': f"Your article '{submission.title}' was rejected. See comments for feedback.",
                    'link': "/my-submissions",
                    'recipientId': submission.authorId
                })
                # 2. Push real-time
                await broadcast.push(
                    user_id=submission.authorId,
                    message=message_payload
                )
            # --- END NOTIFICATION ---

            return True
        except Exception as e:
            print(f"Error rejecting page {page_id}: {e}")
            return False

    async def get_full_content_tree(self) -> List[ContentNode]:
        """
        Recursively builds a tree of all content, enriching it with author and status data from the local DB.
        """
        root_nodes = []
        for slug, root_id in self.root_page_ids.items():
            try:
                # Fetch root page details from Confluence
                root_page = self.confluence.get_page_by_id(root_id, expand="version")
                if not root_page:
                    continue

                # Recursively fetch children
                children = await self._get_child_nodes_recursive(root_id)

                node = ContentNode(
                    id=root_id,
                    title=root_page['title'],
                    # Root pages don't have authors/status in our system, so we can mock it
                    author="System",
                    status=ArticleSubmissionStatus.PUBLISHED,
                    updatedAt=root_page['version']['when'],
                    confluenceUrl=f"{self.settings.confluence_url}/spaces/{self.settings.confluence_space_key}/pages/{root_id}",
                    children=children
                )
                root_nodes.append(node)
            except Exception as e:
                print(f"Error processing root page {slug} ({root_id}): {e}")

        return root_nodes

    async def _get_child_nodes_recursive(self, parent_id: str) -> List[ContentNode]:
        """ Helper function to recursively fetch and build the content tree for children of a given page.
        """
        children_nodes = []
        try:
            # Get all child pages from Confluence
            child_pages = self.confluence.get_child_pages(parent_id)

            for child_page_stub in child_pages:
                child_id = child_page_stub['id']
                
                child_page_details = self.confluence.get_page_by_id(child_id, expand="version")
                if not child_page_details:
                    continue

                # Get submission info from our DB
                submission = await db.articlesubmission.find_unique(where={'confluencePageId': child_id})
                
                author_name = "N/A"
                status = ArticleSubmissionStatus.PUBLISHED # Default to published if not in our DB
                
                if submission:
                    author = await db.user.find_unique(where={'id': submission.authorId})
                    if author:
                        author_name = author.name
                    status = submission.status
                
                # Recursively get the children of this child
                grandchildren = await self._get_child_nodes_recursive(child_id)
                
                node = ContentNode(
                    id=child_id,
                    title=child_page_details['title'],
                    author=author_name,
                    status=status,
                    updatedAt=child_page_details['version']['when'],
                    confluenceUrl=f"{self.settings.confluence_url}/spaces/{self.settings.confluence_space_key}/pages/{child_id}",
                    children=grandchildren
                )
                children_nodes.append(node)
        except Exception as e:
            print(f"Error fetching children for page {parent_id}: {e}")
        
        return children_nodes
    
    async def get_submissions_by_author(self, author_id: int) -> List[dict]:
        """ Fetches all article submissions for a specific author from the database.
        """
        try:
            submissions = await db.articlesubmission.find_many(
                where={'authorId': author_id},
                order={'updatedAt': 'desc'}
            )
            return [sub.model_dump() for sub in submissions]
        except Exception as e:
            print(f"Error fetching submissions for author ID {author_id}: {e}")
            return []
    
    async def resubmit_page_for_review(self, page_id: str) -> bool:
        """ Changes a page's status from REJECTED back to PENDING_REVIEW.
        """
        try:
            # Step 1: Swap the labels in Confluence
            self._remove_label_from_page(page_id, "status-rejected")
            self._add_label_to_page(page_id, "status-unpublished")
            
            # Step 2: Update the status in our database
            submission = await db.articlesubmission.update(
                where={'confluencePageId': page_id},
                data={'status': ArticleSubmissionStatus.PENDING_REVIEW}
            )

            # --- NOTIFICATION FOR ADMINS ---
            if submission:
                author = await db.user.find_unique(where={'id': submission.authorId})
                author_name = author.name if author else "A user"
                await self._notify_all_admins(
                    message=f"Article '{submission.title}' was resubmitted by {author_name} and is pending review.",
                    link="/admin/dashboard"
                )
            # --- END NOTIFICATION ---

            return True
        except Exception as e:
            print(f"Error resubmitting page {page_id}: {e}")
            return False
    
    
    async def delete_page_permanently(self, page_id: str) -> bool:
        """
        Moves a Confluence page to the trash and deletes its record from the ArticleSubmission table.
        """
        try:
            # Step 1: Delete the page in Confluence (this moves it to the trash).
            # The default behavior of remove_page is to trash the content.
            self.confluence.remove_page(page_id=page_id)
            print(f"Successfully moved Confluence page {page_id} to trash.")

            # Step 2: Delete the record from our local database.
            # This might not exist for non-article pages (like categories), so we handle that.
            submission = await db.articlesubmission.find_unique(where={'confluencePageId': page_id})
            if submission:
                await db.articlesubmission.delete(where={'confluencePageId': page_id})
                print(f"Successfully deleted submission record for page {page_id}.")
            
            return True
        except Exception as e:
            print(f"Error during permanent deletion of page {page_id}: {e}")
            # In a real-world scenario, you might want to handle rollback logic,
            # but for now, logging the error is sufficient.
            return False