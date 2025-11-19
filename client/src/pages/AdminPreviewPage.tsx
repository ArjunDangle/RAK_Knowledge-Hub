// Create this new file at client/src/pages/AdminPreviewPage.tsx

import { useParams } from "react-router-dom";
import { KnowledgeLayout } from "./KnowledgeLayout";
import ArticlePage from "./ArticlePage";

// This component acts as a secure wrapper for a full-page preview.
export default function AdminPreviewPage() {
  const { pageId } = useParams<{ pageId: string }>();

  // The breadcrumbs show the user they are in a special "preview" section.
  const breadcrumbs = [
    { label: "Admin" },
    { label: "Preview" },
  ];

  if (!pageId) {
    return (
      <KnowledgeLayout breadcrumbs={breadcrumbs}>
        <div className="text-center">Article ID is missing.</div>
      </KnowledgeLayout>
    );
  }

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      {/* 
        This is the key part. We render the existing ArticlePage component,
        but the `isPreviewMode={true}` prop tells it to fetch data from the
        secure `/cms/admin/preview/:pageId` backend endpoint instead of the
        public `/article/:pageId` endpoint.
      */}
      <ArticlePage pageId={pageId} isPreviewMode={true} />
    </KnowledgeLayout>
  );
}