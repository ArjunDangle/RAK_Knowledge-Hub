// client/src/pages/ArticlePage.tsx
import { useParams, useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Clock, Eye, Calendar, Share, Printer, Info, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { ArticleCardSkeleton } from "@/components/ui/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { getArticleById, getRelatedArticles, getAncestors, API_BASE_URL, getArticleForPreview } from "@/lib/api/api-client";
import { toast } from "@/components/ui/sonner";
import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PdfSlideshow } from "@/components/pdf/PdfSlideshow";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { getColorFromId } from "@/lib/utils/visual-utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/AuthContext";

interface ArticlePageProps {
  pageId?: string;
  isPreviewMode?: boolean;
}

export default function ArticlePage({ pageId: propPageId, isPreviewMode = false }: ArticlePageProps) {
  const params = useParams<{ pageId: string }>();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const pageId = propPageId || params.pageId;
  
  const noticeStatus = searchParams.get('status');
  const shouldShowNotice = isAuthenticated && (noticeStatus === 'pending' || noticeStatus === 'preview');
    
  const noticeContent = {
      title: noticeStatus === 'pending' ? "Pending Approval" : "Admin Preview Mode",
      description: noticeStatus === 'pending'
          ? "This article hasn't been approved by the admin yet, but this is how it will look after it has been approved."
          : "You are viewing this article in admin preview mode. This content is not yet visible to regular users."
  };

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);

  const { data: article, isLoading: articleLoading, isError: articleError } = useQuery({
    queryKey: ['article', pageId, isPreviewMode],
    queryFn: () => {
      if (!pageId) return Promise.resolve(null);
      return isPreviewMode ? getArticleForPreview(pageId) : getArticleById(pageId);
    },
    enabled: !!pageId,
    retry: false,
  });
  
  const contentBlocks = useMemo(() => {
    if (!article || !pageId) return [];

    const fullHtml = article.html;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = fullHtml;

    const images = tempDiv.getElementsByTagName('img');
    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const src = img.getAttribute('src');
        if (src && src.includes('/wiki/download/attachments/')) {
            const urlParts = src.split('/');
            const filenameIndex = urlParts.findIndex(part => part === 'attachments') + 2;
            if (filenameIndex < urlParts.length) {
                const filename = decodeURIComponent(urlParts[filenameIndex].split('?')[0]);
                img.src = `${API_BASE_URL}/attachment/${pageId}/${filename}`;
            }
        }
    }

    const blocks: { type: 'html' | 'pdf' | 'video'; content?: string; fileName?: string }[] = [];
    let currentHtml = '';

    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];

    tempDiv.childNodes.forEach(node => {
        let nodeHandled = false;
        if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement;

            if (element.matches('div[data-macro-name="viewpdf"]')) {
                if (currentHtml.trim() !== '') { blocks.push({ type: 'html', content: currentHtml }); currentHtml = ''; }
                const attachmentName = element.querySelector('div[data-attachment-name]')?.getAttribute('data-attachment-name');
                if (attachmentName) {
                    blocks.push({ type: 'pdf', fileName: attachmentName });
                }
                nodeHandled = true;
            }
            else if (element.matches('span.confluence-embedded-file-wrapper')) {
                const link = element.querySelector('a');
                const href = link?.getAttribute('href') || '';
                
                if (videoExtensions.some(ext => href.toLowerCase().includes(ext))) {
                    if (currentHtml.trim() !== '') { blocks.push({ type: 'html', content: currentHtml }); currentHtml = ''; }
                    const parts = href.split('/');
                    const lastPart = parts[parts.length - 1];
                    const attachmentName = decodeURIComponent(lastPart.split('?')[0]);
                    blocks.push({ type: 'video', fileName: attachmentName });
                    nodeHandled = true;
                }
            }
        }

        if (!nodeHandled) {
            currentHtml += (node as any).outerHTML || node.textContent;
        }
    });
    
    if (currentHtml.trim() !== '') {
        blocks.push({ type: 'html', content: currentHtml });
    }

    return blocks.length > 0 ? blocks : [{ type: 'html', content: fullHtml }];
  }, [article, pageId]);
  
  const { data: relatedArticles, isLoading: relatedLoading } = useQuery({ queryKey: ['relatedArticles', article?.id], queryFn: () => article ? getRelatedArticles(article.tags, article.id) : Promise.resolve([]), enabled: !!article && !isPreviewMode });
  const { data: ancestors } = useQuery({ queryKey: ['ancestors', pageId], queryFn: () => pageId ? getAncestors(pageId) : Promise.resolve([]), enabled: !!pageId && !isPreviewMode });

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
  
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const handleShare = () => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied to clipboard!"); };
  const handlePrint = () => window.print();

  if (articleLoading) {
    const skeleton = <div className="max-w-4xl mx-auto py-8 space-y-4"><Skeleton className="h-10 w-3/4" /><Skeleton className="h-5 w-1/2" /><div className="space-y-4"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-[90%]" /></div></div>;
    return isPreviewMode ? <div className="p-6">{skeleton}</div> : <KnowledgeLayout>{skeleton}</KnowledgeLayout>;
  }

  if (articleError || !article) {
    const errorContent = <div className="text-center py-20"><h1 className="text-2xl font-bold">Article Not Found</h1><p className="text-muted-foreground">The article you're looking for doesn't exist or has been moved.</p></div>;
    return isPreviewMode ? <div className="p-6">{errorContent}</div> : <KnowledgeLayout>{errorContent}</KnowledgeLayout>;
  }
  
  const breadcrumbs = ancestors ? [...ancestors.map((ancestor, index) => { if (index === 0) { return { label: ancestor.title, href: `/category/${article.group}` }; } return { label: ancestor.title, href: `/page/${ancestor.id}` }; }), { label: article.title }] : [];

  const renderContent = () => (
    <>
      <header className="mb-8">
          <div className="flex justify-between items-start mb-4">
              <h1 className="text-4xl font-bold text-foreground leading-tight flex-1 pr-8">{article.title}</h1>
              {!isPreviewMode && (
                  <div className="flex gap-2 flex-shrink-0">
                      {/* --- THIS IS THE NEW CONDITIONAL EDIT BUTTON --- */}
                      {article.canEdit && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button asChild variant="outline" size="icon">
                              <Link to={`/edit/${article.id}`}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit Page</span>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent><p>Edit page</p></TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handleShare}><Share className="h-4 w-4" /><span className="sr-only">Share</span></Button></TooltipTrigger><TooltipContent><p>Share article</p></TooltipContent></Tooltip>
                      <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" onClick={handlePrint}><Printer className="h-4 w-4" /><span className="sr-only">Print</span></Button></TooltipTrigger><TooltipContent><p>Print article</p></TooltipContent></Tooltip>
                  </div>
              )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
              <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /><span>Updated {formatDate(article.updatedAt)}</span></div>
              <div className="flex items-center gap-1.5"><Clock className="h-4 w-4" /><span>{article.readMinutes} min read</span></div>
              <div className="flex items-center gap-1.5"><Eye className="h-4 w-4" /><span>{article.views.toLocaleString()} views</span></div>
              {article.author && (<span>By {article.author}</span>)}
          </div>
          <div className="flex flex-wrap gap-2 mb-6">{article.tags.map((tag) => (<Badge key={tag.id} variant="secondary">{tag.name}</Badge>))}</div>
      </header>
      <Separator className="mb-8" />
      {contentBlocks.map((block, index) => {
          if (block.type === 'pdf' && pageId && block.fileName) { return <PdfSlideshow key={`pdf-${index}`} fileUrl={`${API_BASE_URL}/attachment/${pageId}/${block.fileName}`} />; }
          if (block.type === 'video' && pageId && block.fileName) { return <VideoPlayer key={`video-${index}`} fileUrl={`${API_BASE_URL}/attachment/${pageId}/${block.fileName}`} />; }
          if (block.type === 'html' && block.content) { return (<div key={`html-${index}`} className="prose dark:prose-invert max-w-none mb-12" dangerouslySetInnerHTML={{ __html: block.content }} />); }
          return null;
      })}
      {relatedArticles && relatedArticles.length > 0 && !isPreviewMode && (
        <section>
          <Separator className="mb-8" />
          <h2 className="text-2xl font-bold text-foreground mb-6">Related Articles</h2>
          {relatedLoading ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{Array.from({ length: 4 }).map((_, i) => <ArticleCardSkeleton key={i} />)}</div>) : (<div className="grid grid-cols-1 md:grid-cols-2 gap-6">{relatedArticles.map((related) => (<ArticleCard key={related.id} article={related} showGroup={true} pastelColor={getColorFromId(related.id)} />))}</div>)}
        </section>
      )}
    </>
  );
  
  if (isPreviewMode) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto">
        {shouldShowNotice && (
            <Alert className="mb-8 border-yellow-300 bg-yellow-50 text-yellow-900 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
                <Info className="h-4 w-4" />
                <AlertTitle>{noticeContent.title}</AlertTitle>
                <AlertDescription className="italic">
                    {noticeContent.description}
                </AlertDescription>
            </Alert>
        )}
        {renderContent()}
      </div>
       {!isPreviewMode && (
          <>
            <Dialog open={!!selectedImage} onOpenChange={(isOpen) => !isOpen && setSelectedImage(null)}>
                <DialogContent className="sm:max-w-4xl p-2 bg-transparent border-none shadow-none"><DialogTitle className="sr-only">Enlarged Image</DialogTitle><DialogDescription className="sr-only">An enlarged view of the image.</DialogDescription><img src={selectedImage || ''} alt="Enlarged view" className="w-full h-auto max-h-[90vh] object-contain" /></DialogContent>
            </Dialog>
            <Dialog open={isHtmlModalOpen} onOpenChange={setIsHtmlModalOpen}>
                <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>Raw Confluence Storage Format</DialogTitle><DialogDescription>This is the exact HTML/XML content stored in Confluence for this page.</DialogDescription></DialogHeader><ScrollArea className="h-[60vh] rounded-md border p-4"><pre className="text-sm"><code>{article.html}</code></pre></ScrollArea></DialogContent>
            </Dialog>
          </>
      )}
    </KnowledgeLayout>
  );
}