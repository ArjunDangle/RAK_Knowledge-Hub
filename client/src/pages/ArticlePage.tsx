import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, Eye, Calendar, Share, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { ArticleCardSkeleton } from "@/components/ui/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { getArticleById, getRelatedArticles } from "@/lib/api/api-client"; // <-- CHANGED
import { toast } from "@/components/ui/sonner";

export default function ArticlePage() {
  const { pageId } = useParams<{ pageId: string }>(); // <-- CHANGED from slug

  const { data: article, isLoading: articleLoading, isError: articleError } = useQuery({
    queryKey: ['article', pageId], // <-- CHANGED
    queryFn: () => pageId ? getArticleById(pageId) : Promise.resolve(null), // <-- CHANGED
    enabled: !!pageId,
    retry: false,
  });

  const { data: relatedArticles, isLoading: relatedLoading } = useQuery({
    queryKey: ['relatedArticles', article?.id],
    queryFn: () => article ? getRelatedArticles(article.tags, article.id) : Promise.resolve([]), // <-- CHANGED
    enabled: !!article,
  });

  if (articleLoading) {
    return <KnowledgeLayout><div className="max-w-4xl mx-auto py-8 space-y-4"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-5 w-1/2" /><div className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-[90%]" /></div></div></KnowledgeLayout>;
  }

  if (articleError || !article) {
    return <KnowledgeLayout><div className="text-center py-20"><h1 className="text-2xl font-bold">Article Not Found</h1><p className="text-muted-foreground">The article you're looking for doesn't exist or has been moved.</p></div></KnowledgeLayout>;
  }

  const groupLabels: { [key: string]: string } = { departments: 'Departments', 'resource-centre': 'Resource Centre', tools: 'Tools' };

  const breadcrumbs = [
    { label: groupLabels[article.group] || article.group, href: `/category/${article.group}` },
    { label: article.subsection.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }, // This won't be a link for now
    { label: article.title }
  ];

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handlePrint = () => window.print();

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /><span>Updated {formatDate(article.updatedAt)}</span></div>
            <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /><span>{article.readMinutes} min read</span></div>
            <div className="flex items-center gap-1.5"><Eye className="h-4 w-4" /><span>{article.views.toLocaleString()} views</span></div>
            {article.author && (<span>By {article.author}</span>)}
          </div>
          <div className="flex flex-wrap gap-2 mb-6">{article.tags.map((tag) => (<Badge key={tag.id} variant="secondary">{tag.name}</Badge>))}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}><Share className="h-4 w-4 mr-2" />Share</Button>
            <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-4 w-4 mr-2" />Print</Button>
          </div>
        </header>

        <Separator className="mb-8" />
        <article className="prose prose-gray dark:prose-invert max-w-none mb-12" dangerouslySetInnerHTML={{ __html: article.html }} />

        {relatedArticles && relatedArticles.length > 0 && (
          <section>
            <Separator className="mb-8" />
            <h2 className="text-2xl font-bold text-foreground mb-6">Related Articles</h2>
            {relatedLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Array.from({ length: 4 }).map((_, i) => <ArticleCardSkeleton key={i} />)}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{relatedArticles.map((related) => (<ArticleCard key={related.id} article={related} showGroup={true} />))}</div>
            )}
          </section>
        )}
      </div>
    </KnowledgeLayout>
  );
}