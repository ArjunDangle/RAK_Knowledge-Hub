# services/confluence_service.py
import re
from typing import List, Dict, Union
from atlassian import Confluence
from bs4 import BeautifulSoup
from config import Settings
from schemas.content_schemas import Article, Tag, Subsection, GroupInfo, PageContentItem, Ancestor
from fastapi.responses import StreamingResponse
import io
import mimetypes # <--- I'll add this import

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
            print("CRITICAL: Could not discover any root page IDs. Please check SPACE_KEY and top-level page titles.")

    def _discover_root_pages(self) -> Dict[str, str]:
        space_key = self.settings.confluence_space_key
        print(f"Attempting to discover root pages in space: '{space_key}'...")
        
        discovered_ids = {}
        expected_titles = { "Department": "departments", "Resource Centre": "resource-centre", "Tools": "tools" }

        for title, slug in expected_titles.items():
            try:
                search_path = f'/rest/api/content?spaceKey={space_key}&title={title}&limit=1'
                results = self.confluence.get(search_path).get('results', [])
                
                if results and not results[0].get('parent'):
                    page_id = results[0]['id']
                    discovered_ids[slug] = page_id
                    print(f"  -> MATCH FOUND: '{title}' -> ID: {page_id}")
                else:
                    print(f"  -> WARNING: Could not find a top-level page with the exact title '{title}'.")
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

    def _transform_page_to_article(self, page_data: dict) -> Article:
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
        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        tags = [Tag(id=label["id"], name=label["name"], slug=self._slugify(label["name"])) for label in raw_labels]
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

    def _transform_page_to_subsection(self, page_data: dict) -> Subsection:
        ancestors = page_data.get('ancestors', [])
        if not ancestors: return None

        group_slug = self._get_group_from_ancestors(ancestors)
        if not group_slug: return None

        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        tags = [Tag(id=label["id"], name=label["name"], slug=self._slugify(label["name"])) for label in raw_labels]
        html_content = page_data.get("body", {}).get("view", {}).get("value", "")
        plain_text = self._get_plain_text(html_content)
        description = (plain_text[:250] + '...') if len(plain_text) > 250 else plain_text
        
        child_pages_generator = self.confluence.get_child_pages(page_data['id'])
        article_count = len(list(child_pages_generator))
        
        subsection_data = { "id": page_data["id"], "slug": self._slugify(page_data["title"]), "title": page_data["title"], "description": description or "No description available.", "group": group_slug, "tags": tags, "articleCount": article_count, "updatedAt": page_data["version"]["when"], }
        return Subsection.model_validate(subsection_data)

    def _fetch_and_transform_articles_from_cql(self, cql: str, limit: int) -> List[Article]:
        try:
            search_path = f'/rest/api/content/search?cql={cql}&limit={limit}&expand=body.view,version,metadata.labels,ancestors'
            results = self.confluence.get(search_path).get('results', [])
            
            articles = []
            for page_data in results:
                transformed_article = self._transform_page_to_article(page_data)
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

    def get_page_contents(self, parent_page_id: str) -> List[PageContentItem]:
        try:
            child_page_stubs = list(self.confluence.get_child_pages(parent_page_id))
            
            content_items = []
            for stub in child_page_stubs:
                page = self.confluence.get_page_by_id(stub['id'], expand="body.view,version,metadata.labels,ancestors")
                
                grand_children = list(self.confluence.get_child_pages(page['id']))
                
                if len(grand_children) > 0:
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

    def get_article_by_id(self, page_id: str) -> Article:
        try:
            article_page = self.confluence.get_page_by_id(page_id, expand="body.view,version,metadata.labels,ancestors")
            return self._transform_page_to_article(article_page)
        except Exception as e:
            print(f"Error fetching article ID {page_id}: {e}")
            return None

    def get_page_by_id(self, page_id: str) -> Subsection:
        try:
            page_data = self.confluence.get_page_by_id(page_id, expand="version,metadata.labels,body.view,ancestors")
            return self._transform_page_to_subsection(page_data)
        except Exception as e:
            print(f"Error fetching page ID {page_id}: {e}")
            return None
    
    def get_attachment_data(self, page_id: str, file_name: str) -> StreamingResponse:
        try:
            attachments = self.confluence.get_attachments_from_content(page_id=page_id, limit=200)
            
            target_attachment = None
            for attachment in attachments['results']:
                if attachment['title'] == file_name:
                    target_attachment = attachment
                    break
            
            if not target_attachment:
                print(f"Attachment '{file_name}' not found on page '{page_id}'")
                return None

            download_link = self.settings.confluence_url + target_attachment['_links']['download']
            
            response = self.confluence.session.get(download_link, stream=True)
            response.raise_for_status()

            # ===== MODIFICATION START =====
            # Guess the MIME type of the file based on its extension.
            # Provide a default if the type cannot be determined.
            mimetype, _ = mimetypes.guess_type(file_name)
            media_type = mimetype or 'application/octet-stream'

            # Stream the content with the determined media type.
            return StreamingResponse(response.iter_content(chunk_size=8192), media_type=media_type)
            # ===== MODIFICATION END =====

        except Exception as e:
            print(f"Error fetching attachment '{file_name}' for page ID {page_id}: {e}")
            return None

    def get_recent_articles(self, limit: int = 6) -> List[Article]:
        cql = f'space = "{self.settings.confluence_space_key}" and type = page order by lastModified desc'
        return self._fetch_and_transform_articles_from_cql(cql, limit)

    def get_popular_articles(self, limit: int = 6) -> List[Article]:
        cql = f'space = "{self.settings.confluence_space_key}" and type = page order by created desc'
        return self._fetch_and_transform_articles_from_cql(cql, limit)

    def get_whats_new(self, limit: int = 20) -> List[Article]:
        return self.get_recent_articles(limit)
    
    def get_all_tags(self) -> List[Tag]:
        try:
            path = f'/rest/api/space/{self.settings.confluence_space_key}/label'
            labels_data = self.confluence.get(path, params={'limit': 200}).get('results', [])

            tags = [
                Tag(id=label["id"], name=label["name"], slug=self._slugify(label["name"]))
                for label in labels_data
            ]
            unique_tags = {tag.name: tag for tag in tags}.values()
            return sorted(list(unique_tags), key=lambda t: t.name)
        except Exception as e:
            print(f"Error fetching all tags: {e}")
            return []

    def search_content(self, query: str, labels: List[str] = None, mode: str = "all") -> List[Article]:
        cql_parts = [f'space = "{self.settings.confluence_space_key}"', 'type = page']

        if mode == "tags":
            tag_list = query.strip().split()
            if not tag_list:
                return []
            
            label_clauses = [f'label = "{tag}"' for tag in tag_list]
            cql_parts.extend(label_clauses)
        
        elif mode == "title":
            cql_parts.append(f'title ~ "{query}"')
        
        else:  # "all" or "content"
            cql_parts.append(f'text ~ "{query}"')
        
        if labels:
            label_clauses_from_param = [f'label = "{l}"' for l in labels]
            cql_parts.extend(label_clauses_from_param)

        cql = ' and '.join(cql_parts) + ' order by lastModified desc'
        
        return self._fetch_and_transform_articles_from_cql(cql, 50)