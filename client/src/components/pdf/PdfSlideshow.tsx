import { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';

pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

interface PdfSlideshowProps {
  fileUrl: string;
}

export function PdfSlideshow({ fileUrl }: PdfSlideshowProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [modalPageNumber, setModalPageNumber] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, []);


  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function handleOpenModal() {
    setModalPageNumber(pageNumber);
    setIsModalOpen(true);
  }

  function goToPrevPage() { setPageNumber(p => Math.max(p - 1, 1)); }
  function goToNextPage() { if (numPages) setPageNumber(p => Math.min(p + 1, numPages)); }

  function goToModalPrevPage() { setModalPageNumber(p => Math.max(p - 1, 1)); }
  function goToModalNextPage() { if (numPages) setModalPageNumber(p => Math.min(p + 1, numPages)); }

  return (
    <>
      <div className="not-prose my-6 flex flex-col items-center gap-4">
        <div 
          ref={containerRef}
          className="w-full border rounded-md overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
          onClick={handleOpenModal}
        >
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<Skeleton style={{ width: containerWidth || '100%', aspectRatio: '16/9' }} />}
            error={<p>Failed to load PDF file.</p>}
          >
            {/* ===== MODIFICATION START ===== */}
            <Page 
              pageNumber={pageNumber} 
              width={containerWidth} 
              renderTextLayer={false} 
              renderAnnotationLayer={false} 
              // This prop shows a skeleton while an individual page is rendering,
              // improving perceived performance when navigating between pages.
              loading={<Skeleton style={{ width: containerWidth, height: containerWidth * 9/16, backgroundColor: 'hsl(var(--muted))' }} />}
            />
            {/* ===== MODIFICATION END ===== */}
          </Document>
        </div>
        
        {numPages && (
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" onClick={goToPrevPage} disabled={pageNumber <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm text-muted-foreground">Page {pageNumber} of {numPages}</p>
            <Button variant="outline" size="icon" onClick={goToNextPage} disabled={pageNumber >= numPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="w-screen h-screen max-w-full max-h-full p-0 gap-0 flex items-center justify-center bg-black/80 backdrop-blur-sm border-none">
          <DialogTitle className="sr-only">Expanded PDF View</DialogTitle>
          <DialogDescription className="sr-only">An expanded view of page {modalPageNumber}.</DialogDescription>
          
          <div className="relative w-full h-full flex items-center justify-center">
            <Document file={fileUrl} loading={<Skeleton className="w-[80vw] h-[80vh]" />}>
              {/* ===== MODIFICATION START ===== */}
              <Page 
                pageNumber={modalPageNumber} 
                className="flex justify-center [&>canvas]:max-w-full [&>canvas]:max-h-full [&>canvas]:h-auto [&>canvas]:w-auto"
                // This provides a simple text loader for the fullscreen modal view.
                loading={<p className="text-white text-lg">Loading page...</p>}
              />
              {/* ===== MODIFICATION END ===== */}
            </Document>
            
            {numPages && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white"
                  onClick={goToModalPrevPage} 
                  disabled={modalPageNumber <= 1}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white"
                  onClick={goToModalNextPage} 
                  disabled={modalPageNumber >= numPages}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/30 text-white text-sm rounded-md px-3 py-1">
                  Page {modalPageNumber} of {numPages}
                </div>
              </>
            )}

            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-12 w-12 rounded-full bg-black/20 text-white hover:bg-black/40 hover:text-white"
              >
                <X className="h-6 w-6" />
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}