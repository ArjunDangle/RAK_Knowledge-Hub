# services/confluence_service.py
import re
from typing import List, Dict, Union
from atlassian import Confluence
from bs4 import BeautifulSoup
from config import Settings
# --- THIS IS THE CORRECTED LINE ---
from schemas.content_schemas import Article, Tag, Subsection, GroupInfo, PageContentItem, Ancestor

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
                cql = f'space = "{space_key}" and title = "{title}"'
                results = self.confluence.cql(cql, limit=1).get('results', [])
                
                if results:
                    parent_info = results[0]['content'].get('parent')
                    if parent_info is None:
                        page_id = results[0]['content']['id']
                        discovered_ids[slug] = page_id
                        print(f"  -> MATCH FOUND: '{title}' -> ID: {page_id}")
                    else:
                        print(f"  -> WARNING: Found page '{title}' but it is not a top-level page. Skipping.")
                else:
                    print(f"  -> WARNING: Could not find a page with the exact title '{title}' in space '{space_key}'.")
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

    def _transform_page_to_article(self, page_data: dict, group_slug: str, subsection_slug: str) -> Article:
        html_content = page_data.get("body", {}).get("view", {}).get("value", "")
        plain_text = self._get_plain_text(html_content)
        word_count = len(plain_text.split())
        read_minutes = max(1, round(word_count / 200))
        excerpt = (plain_text[:150] + '...') if len(plain_text) > 150 else plain_text
        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        tags = [Tag(id=label["id"], name=label["name"], slug=self._slugify(label["name"])) for label in raw_labels]
        author_info = page_data.get("version", {}).get("by", {})
        author_name = author_info.get("displayName") if author_info else "Unknown"
        
        article_data = { "id": page_data["id"], "slug": self._slugify(page_data["title"]), "title": page_data["title"], "excerpt": excerpt, "html": html_content, "tags": tags, "group": group_slug, "subsection": subsection_slug, "updatedAt": page_data["version"]["when"], "views": 0, "readMinutes": read_minutes, "author": author_name }
        return Article.model_validate(article_data)

    def _transform_page_to_subsection(self, page_data: dict, group_slug: str) -> Subsection:
        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        tags = [Tag(id=label["id"], name=label["name"], slug=self._slugify(label["name"])) for label in raw_labels]
        html_content = page_data.get("body", {}).get("view", {}).get("value", "")
        plain_text = self._get_plain_text(html_content)
        description = (plain_text[:250] + '...') if len(plain_text) > 250 else plain_text
        
        child_pages_generator = self.confluence.get_child_pages(page_data['id'])
        article_count = len(list(child_pages_generator))
        
        subsection_data = { "id": page_data["id"], "slug": self._slugify(page_data["title"]), "title": page_data["title"], "description": description or "No description available.", "group": group_slug, "tags": tags, "articleCount": article_count, "updatedAt": page_data["version"]["when"], }
        return Subsection.model_validate(subsection_data)
        
    def get_groups(self) -> List[GroupInfo]:
        return [
            GroupInfo(id='departments', title='Departments', description='Resources organized by team functions', icon='Building2'),
            GroupInfo(id='resource-centre', title='Resource Centre', description='Comprehensive knowledge base and docs', icon='BookOpen'),
            GroupInfo(id='tools', title='Tools', description='Development tools, utilities, and guides', icon='Wrench'),
        ]
        
    def get_subsections_by_group(self, group_slug: str) -> List[Subsection]:
        root_page_id = self.root_page_ids.get(group_slug)
        if not root_page_id: return []
        
        subsection_stubs = list(self.confluence.get_child_pages(root_page_id))
        if not subsection_stubs: return []
        
        detailed_subsections = []
        for stub in subsection_stubs:
            try:
                page_details = self.confluence.get_page_by_id(stub['id'], expand="version,metadata.labels,body.view")
                if page_details:
                    detailed_subsections.append(page_details)
            except Exception as e:
                print(f"Could not fetch details for child page {stub['id']}: {e}")
        
        return [self._transform_page_to_subsection(page, group_slug) for page in detailed_subsections]

    def get_page_contents(self, parent_page_id: str) -> List[PageContentItem]:
        try:
            ancestors = self.confluence.get_page_ancestors(parent_page_id)
            if not ancestors: return []

            group_slug = self._get_group_from_ancestors(ancestors)
            
            parent_page = self.confluence.get_page_by_id(parent_page_id)
            parent_slug = self._slugify(parent_page['title'])
            child_page_stubs = list(self.confluence.get_child_pages(parent_page_id))
            
            content_items = []
            for stub in child_page_stubs:
                page = self.confluence.get_page_by_id(stub['id'], expand="body.view,version,metadata.labels")
                grand_children = list(self.confluence.get_child_pages(page['id']))
                
                if len(grand_children) > 0:
                    content_items.append(self._transform_page_to_subsection(page, group_slug))
                else:
                    content_items.append(self._transform_page_to_article(page, group_slug, parent_slug))
            
            return content_items
        except Exception as e:
            print(f"Error in get_page_contents for parent {parent_page_id}: {e}")
            return []

    def get_article_by_id(self, page_id: str) -> Article:
        try:
            article_page = self.confluence.get_page_by_id(page_id, expand="body.view,version,metadata.labels,ancestors")
            ancestors = article_page.get('ancestors', [])
            if not ancestors: return None
            
            group_slug = self._get_group_from_ancestors(ancestors)
            subsection_slug = self._slugify(ancestors[-1]['title'])
            return self._transform_page_to_article(article_page, group_slug, subsection_slug)
        except Exception as e:
            print(f"Error fetching article ID {page_id}: {e}")
            return None

    def get_page_by_id(self, page_id: str) -> Subsection:
        try:
            page_data = self.confluence.get_page_by_id(page_id, expand="version,metadata.labels,body.view,ancestors")
            ancestors = page_data.get('ancestors', [])
            if not ancestors: return None
                
            group_slug = self._get_group_from_ancestors(ancestors)
            return self._transform_page_to_subsection(page_data, group_slug)
        except Exception as e:
            print(f"Error fetching page ID {page_id}: {e}")
            return None

    def get_ancestors(self, page_id: str) -> List[Ancestor]:
        try:
            ancestors_data = self.confluence.get_page_ancestors(page_id)
            return [Ancestor(id=a['id'], title=a['title']) for a in ancestors_data]
        except Exception as e:
            print(f"Error fetching ancestors for page ID {page_id}: {e}")
            return []
    
    def get_whats_new(self, limit: int = 20) -> List[Article]:
        cql = f'space = "{self.settings.confluence_space_key}" and type = page order by lastModified desc'
        results = self.confluence.cql(cql, limit=limit, expand="body.view,version,metadata.labels,ancestors")
        if not results or 'results' not in results: return []
        articles = []
        for result in results['results']:
            article_page = result['content']
            ancestors = article_page.get('ancestors', [])
            if not ancestors: continue
            group_slug = self._get_group_from_ancestors(ancestors)
            if not group_slug: continue
            subsection_slug = self._slugify(ancestors[-1]['title'])
            articles.append(self._transform_page_to_article(article_page, group_slug, subsection_slug))
        return articles

    def search_content(self, query: str, labels: List[str] = None) -> List[Article]:
        label_cql = f" and label in ({','.join(f"'{l}'" for l in labels)})" if labels else ""
        cql = f'space = "{self.settings.confluence_space_key}" and type = page and text ~ "{query}"{label_cql} order by lastModified desc'
        results = self.confluence.cql(cql, limit=50, expand="body.view,version,metadata.labels,ancestors")
        if not results or 'results' not in results: return []
        articles = []
        for result in results['results']:
            article_page = result['content']
            ancestors = article_page.get('ancestors', [])
            if not ancestors: continue
            group_slug = self._get_group_from_ancestors(ancestors)
            if not group_slug: continue
            subsection_slug = self._slugify(ancestors[-1]['title'])
            articles.append(self._transform_page_to_article(article_page, group_slug, subsection_slug))
        return articles