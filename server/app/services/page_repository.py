# server/app/services/page_repository.py
from datetime import datetime
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup 

from app.db import db
from app.schemas.content_schemas import Tag, Article, Subsection, Ancestor
from prisma.enums import PageType
from prisma.models import Page as PageModel
from prisma.types import PageInclude

class PageRepository:
    """
    Handles all database operations related to the Page and Tag models.
    """
    
    def __init__(self):
        self.db = db
        self._page_include: PageInclude = {'tags': True}

    async def _slugify(self, text: str) -> str:
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
            where={'parentConfluenceId': page.confluenceId, 'pageType': PageType.ARTICLE}
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
        """Fetches a single Page by its Confluence ID."""
        return await self.db.page.find_unique(
            where={'confluenceId': confluence_id},
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
            # Pass empty HTML for list view
            subsections.append(await self._format_page_as_subsection(page, group_slug, ""))
        return subsections

    async def get_paginated_children(self, parent_confluence_id: str, page: int, page_size: int) -> dict:
        """Fetches paginated children (both Articles and Subsections) for a parent page."""
        skip = (page - 1) * page_size
        
        child_pages = await self.db.page.find_many(
            where={'parentConfluenceId': parent_confluence_id},
            include=self._page_include,
            skip=skip,
            take=page_size,
            order={'title': 'asc'}
        )
        
        total_items = await self.db.page.count(where={'parentConfluenceId': parent_confluence_id})
        
        return {
            "items": child_pages, # The service layer will format these
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
            # --- THIS IS THE FIX ---
            # Removed the 'select' argument which caused the TypeError
            parent = await self.db.page.find_unique(
                where={'confluenceId': current_page.parentConfluenceId}
            )
            # --- END OF FIX ---
            
            if parent:
                ancestors.append(Ancestor(id=parent.confluenceId, title=parent.title, slug=parent.slug)) # <-- UPDATE THIS LINE
                current_page = parent
            else:
                break
        ancestors.reverse()
        return ancestors

    async def get_recent_articles(self, limit: int = 6) -> List[Article]:
        """Fetches the most recently updated articles."""
        pages = await self.db.page.find_many(
            where={'pageType': PageType.ARTICLE},
            include=self._page_include,
            order={'updatedAt': 'desc'},
            take=limit
        )
        # Note: Group/subsection slugs will be 'unknown' here, which is fine for cards
        return [await self._format_page_as_article(p, "unknown", "unknown") for p in pages]

    async def get_popular_articles(self, limit: int = 6) -> List[Article]:
        """Fetches the most viewed articles."""
        pages = await self.db.page.find_many(
            where={'pageType': PageType.ARTICLE},
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
        """Creates a new Page record in the database."""
        
        tag_connect_ops = []
        for tag_name in tag_names:
            tag_slug = await self._slugify(tag_name)
            tag = await self.db.tag.upsert(
                where={'name': tag_name},
                data={
                    'create': {'name': tag_name, 'slug': tag_slug},
                    'update': {'slug': tag_slug}
                }
            )
            tag_connect_ops.append({'id': tag.id})
        
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
        updated_at_str: str
    ) -> PageModel:
        """Updates the metadata of an existing Page record."""
        return await self.db.page.update(
            where={'confluenceId': confluence_id},
            data={
                'title': title,
                'slug': slug,
                'description': description,
                'updatedAt': updated_at_str,
            }
        )

    async def sync_page_from_confluence_data(
        self, 
        confluence_id: str, 
        page_data: Dict[str, Any],
        page_type: PageType
    ) -> PageModel:
        """
        Updates a Page record using fresh data from a Confluence API response.
        This is used during approval/sync workflows.
        """
        title = page_data["title"]
        author_name = page_data.get("version", {}).get("by", {}).get("displayName", "Unknown")
        updated_at = page_data["version"]["when"]
        
        html_content = page_data.get("body", {}).get("view", {}).get("value", "")
        plain_text = self._get_plain_text(html_content)
        description = (plain_text[:250] + '...') if len(plain_text) > 250 else "No description available."
        
        tag_ops = []
        raw_labels = page_data.get("metadata", {}).get("labels", {}).get("results", [])
        for label in raw_labels:
            tag_name = label["name"]
            if not tag_name.startswith("status-"):
                tag_slug = await self._slugify(tag_name)
                tag = await self.db.tag.upsert(
                    where={'name': tag_name},
                    data={'create': {'name': tag_name, 'slug': tag_slug}, 'update': {'slug': tag_slug}}
                )
                tag_ops.append({'id': tag.id})
        
        return await self.db.page.update(
            where={'confluenceId': confluence_id},
            data={
                'title': title,
                'slug': await self._slugify(title),
                'description': description,
                'pageType': page_type,
                'authorName': author_name,
                'updatedAt': updated_at,
                'tags': {'set': tag_ops} 
            }
        )

