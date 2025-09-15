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
import { getArticleById, getRelatedArticles, getAncestors, API_BASE_URL } from "@/lib/api/api-client";
import { toast } from "@/components/ui/sonner";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PdfSlideshow } from "@/components/pdf/PdfSlideshow"; // Import the new component

export default function ArticlePage() {
  const { pageId } = useParams<{ pageId: string }>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: article, isLoading: articleLoading, isError: articleError } = useQuery({
    queryKey: ['article', pageId],
    queryFn: () => pageId ? getArticleById(pageId) : Promise.resolve(null),
    enabled: !!pageId,
    retry: false,
  });

  const { processedHtml, embeddedPdfFile } = useMemo(() => {
    if (!article) {
      return { processedHtml: null, embeddedPdfFile: null };
    }

    const fullHtml = article.html;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;

    const pdfViewerDiv = tempDiv.querySelector('div[data-macro-name="viewpdf"]');
    
    if (pdfViewerDiv) {
      const attachmentName = pdfViewerDiv.querySelector('div[data-attachment-name]')?.getAttribute('data-attachment-name');
      if (attachmentName) {
        pdfViewerDiv.remove();
        return {
          processedHtml: tempDiv.innerHTML,
          embeddedPdfFile: attachmentName
        };
      }
    }

    return { processedHtml: fullHtml, embeddedPdfFile: null };
  }, [article]);


  const { data: relatedArticles, isLoading: relatedLoading } = useQuery({
    queryKey: ['relatedArticles', article?.id],
    queryFn: () => article ? getRelatedArticles(article.tags, article.id) : Promise.resolve([]),
    enabled: !!article,
  });

  const { data: ancestors } = useQuery({
    queryKey: ['ancestors', pageId],
    queryFn: () => pageId ? getAncestors(pageId) : Promise.resolve([]),
    enabled: !!pageId,
  });

  useEffect(() => {
    const handleImageClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG' && target.closest('.prose')) {
        event.preventDefault();
        const src = target.getAttribute('src');
        if (src) setSelectedImage(src);
      }
    };
    
    document.addEventListener('click', handleImageClick);
    return () => document.removeEventListener('click', handleImageClick);
  }, []);


  if (articleLoading) {
    return <KnowledgeLayout><div className="max-w-4xl mx-auto py-8 space-y-4"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-5 w-1/2" /><div className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-[90%]" /></div></div></KnowledgeLayout>;
  }

  if (articleError || !article) {
    return <KnowledgeLayout><div className="text-center py-20"><h1 className="text-2xl font-bold">Article Not Found</h1><p className="text-muted-foreground">The article you're looking for doesn't exist or has been moved.</p></div></KnowledgeLayout>;
  }

  const breadcrumbs = ancestors
    ? [
        ...ancestors.map((ancestor, index) => {
          if (index === 0) {
            return { label: ancestor.title, href: `/category/${article.group}` };
          }
          return { label: ancestor.title, href: `/page/${ancestor.id}` };
        }),
        { label: article.title },
      ]
    : [];

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const handleShare = () => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied to clipboard!"); };
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
        
        {embeddedPdfFile && pageId && (
            <PdfSlideshow fileUrl={`${API_BASE_URL}/attachment/${pageId}/${embeddedPdfFile}`} />
        )}

        <div className="prose dark:prose-invert max-w-none mb-12"
          dangerouslySetInnerHTML={{ __html: processedHtml || '' }} 
        />

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
      <Dialog open={!!selectedImage} onOpenChange={(isOpen) => !isOpen && setSelectedImage(null)}>
        <DialogContent className="sm:max-w-4xl p-2 bg-transparent border-none shadow-none">
          <DialogTitle className="sr-only">Enlarged Image</DialogTitle>
          <DialogDescription className="sr-only">An enlarged view of the image from the article content.</DialogDescription>
          <img src={selectedImage || ''} alt="Enlarged view" className="w-full h-auto max-h-[90vh] object-contain" />
        </DialogContent>
      </Dialog>
    </KnowledgeLayout>
  );
}