# server/app/services/submission_repository.py
from typing import List, Optional
from datetime import datetime
from app.db import db
from prisma.models import ArticleSubmission
from app.schemas.cms_schemas import ArticleSubmissionStatus  # <-- THIS IS THE FIX

class SubmissionRepository:
    """
    Handles all database operations related to the ArticleSubmission model.
    """
    
    def __init__(self):
        self.db = db
    
    async def get_by_confluence_id_with_author(self, confluence_id: str) -> Optional[ArticleSubmission]:
        """Fetches a submission by its Confluence ID and includes the author's details."""
        return await self.db.articlesubmission.find_unique(
            where={'confluencePageId': confluence_id},
            include={'author': True}
        )

    async def get_by_confluence_id(self, confluence_id: str) -> Optional[ArticleSubmission]:
        """Fetches a submission by its associated Confluence Page ID."""
        return await self.db.articlesubmission.find_unique(
            where={'confluencePageId': confluence_id}
        )

    async def get_by_author_id(self, author_id: int) -> List[ArticleSubmission]:
        """Fetches all submissions for a specific author."""
        return await self.db.articlesubmission.find_many(
            where={'authorId': author_id},
            order={'updatedAt': 'desc'}
        )

    async def get_pending_submissions(self) -> List[ArticleSubmission]:
        """Fetches all submissions with a PENDING_REVIEW status."""
        return await self.db.articlesubmission.find_many(
            where={'status': ArticleSubmissionStatus.PENDING_REVIEW},
            include={'author': True},
            order={'updatedAt': 'desc'}
        )

    async def create_submission(
        self,
        confluence_id: str,
        title: str,
        author_id: int
    ) -> ArticleSubmission:
        """Creates a new ArticleSubmission record."""
        return await self.db.articlesubmission.create(data={
            'confluencePageId': confluence_id,
            'title': title,
            'authorId': author_id,
            'status': ArticleSubmissionStatus.PENDING_REVIEW
        })

    async def update_status(
        self,
        confluence_id: str,
        status: ArticleSubmissionStatus
    ) -> Optional[ArticleSubmission]:
        """Updates the status of an existing submission."""
        return await self.db.articlesubmission.update(
            where={'confluencePageId': confluence_id},
            data={'status': status}
        )
    
    async def update_title(self, confluence_id: str, title: str) -> Optional[ArticleSubmission]:
        """Updates the title of a submission record to keep it in sync with the Page."""
        return await self.db.articlesubmission.update(
            where={'confluencePageId': confluence_id},
            data={'title': title}
        )

    async def delete_by_confluence_id(self, confluence_id: str) -> Optional[ArticleSubmission]:
        """Deletes a submission record by its Confluence Page ID."""
        return await self.db.articlesubmission.delete(
            where={'confluencePageId': confluence_id}
        )

