import React, { useState, useEffect, useRef } from "react";
import { Editor, EditorContent } from "@tiptap/react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { cn } from "@/lib/utils";
import { 
  Minimize2, 
  ArrowLeft, 
  CheckCircle, 
  Save, 
  ListTree, 
  Paperclip, 
  X,
  ChevronRight,
  ChevronLeft,
  PanelLeft,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

// --- Types ---
// eslint-disable-next-line react-refresh/only-export-components
export const MARGIN_OPTIONS = {
  narrow: "p-4",
  normal: "p-8",
  medium: "p-14",
  wide: "p-24",
};

export type MarginType = keyof typeof MARGIN_OPTIONS;

export interface EditorAttachment {
  file?: File;
  tempId: string;
  type: "image" | "video" | "pdf" | "file";
}

interface TocItem {
  id: string;
  text: string;
  level: number;
  pos: number;
  children: TocItem[];
}

interface RichTextEditorProps {
  editor: Editor | null;
  title?: string;
  onUpload?: (file: File) => Promise<string>;
  isSaving?: boolean;
  attachments?: EditorAttachment[];
  onRemoveAttachment?: (tempId: string) => void;
}

export const RichTextEditor = ({ 
  editor, 
  title, 
  onUpload, 
  isSaving,
  attachments = [], 
  onRemoveAttachment
}: RichTextEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [margin, setMargin] = useState<MarginType>("normal");
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editor) return;

    const updateToc = () => {
      const flatHeadings: Omit<TocItem, "children">[] = [];
      let headingIndex = 0;
      
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const id = `heading-${headingIndex}`;
          flatHeadings.push({
            text: node.textContent,
            level: node.attrs.level,
            pos: pos,
            id
          });
          headingIndex++;
        }
      });
      setToc(buildTocTree(flatHeadings));
    };

    updateToc();
    editor.on("update", updateToc);
    return () => { editor.off("update", updateToc); };
  }, [editor]);

  useEffect(() => {
    if (toc.length === 0) return;

    const headingElements = document.querySelectorAll(".prose h1, .prose h2, .prose h3");
    headingElements.forEach((el, index) => {
      el.id = `heading-${index}`;
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { root: scrollContainerRef.current, rootMargin: "-10% 0px -50% 0px" }
    );

    headingElements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [toc, isExpanded]);

  const buildTocTree = (headings: Omit<TocItem, "children">[]) => {
    const root: TocItem[] = [];
    const stack: TocItem[] = [];

    headings.forEach((h) => {
      const newItem: TocItem = { ...h, children: [] };
      while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
        stack.pop();
      }
      if (stack.length === 0) root.push(newItem);
      else stack[stack.length - 1].children.push(newItem);
      stack.push(newItem);
    });
    return root;
  };

  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    editor.commands.setTextSelection(pos);
    const domNode = editor.view.nodeDOM(pos) as HTMLElement;
    if (domNode && domNode.scrollIntoView) {
      domNode.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      editor.commands.scrollIntoView();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onUpload) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) await onUpload(file);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleSection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderTocItems = (items: TocItem[]) => {
    return items.map((item) => {
      const isCollapsed = collapsedSections[item.id];
      const hasChildren = item.children.length > 0;
      const isActive = activeId === item.id;

      return (
        <div key={item.id} className="flex flex-col">
          <div 
            className={cn(
              "group flex items-center gap-1 py-1 px-1 rounded-md transition-all cursor-pointer",
              isActive 
                ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" 
                : "hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-slate-400"
            )}
            onClick={(e) => {
              e.preventDefault();
              scrollToHeading(item.pos);
            }}
          >
            <div 
              className={cn(
                "p-1 rounded-sm transition-transform",
                !hasChildren && "opacity-0 pointer-events-none",
                !isCollapsed ? "rotate-90" : "rotate-0"
              )}
              onClick={(e) => toggleSection(item.id, e)}
            >
              <ChevronRight className="h-3 w-3" />
            </div>
            <span className={cn("truncate text-[13px] flex-1", item.level === 1 ? "font-semibold" : "font-normal")}>
              {item.text || "Untitled Section"}
            </span>
          </div>
          {hasChildren && !isCollapsed && (
            <div className="ml-4 border-l border-slate-200 dark:border-zinc-800 pl-1 mt-0.5">
              {renderTocItems(item.children)}
            </div>
          )}
        </div>
      );
    });
  };

  if (!editor) return null;

  return (
    <div className={cn(
      "transition-all duration-300 ease-in-out",
      isExpanded 
        ? "fixed inset-0 z-[100] bg-[#F9FBFD] dark:bg-zinc-950 flex flex-col" 
        : "relative w-full group flex flex-col border border-slate-200 dark:border-zinc-800 rounded-lg bg-background overflow-hidden shadow-sm"
    )}>
      
      {/* 1. HEADER */}
      <div className={cn("flex-none z-20 bg-white dark:bg-zinc-900 border-b", isExpanded ? "px-4 py-1.5 h-14" : "")}>
        {isExpanded ? (
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center gap-3 flex-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsExpanded(false)} className="h-10 w-10 p-0 rounded-full">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-[18px] font-normal text-slate-900 dark:text-slate-100 truncate max-w-[400px]">
                  {title || "Untitled"}
                </h1>
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground mt-0.5">
                  {isSaving ? (
                    <span className="flex items-center gap-1.5 animate-pulse"><Save className="h-3 w-3" /> Saving...</span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-500"><CheckCircle className="h-3 w-3 text-emerald-600" /> Saved</span>
                  )}
                </div>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsExpanded(false)} className="rounded-full px-6 gap-2">
              <Minimize2 className="h-4 w-4" /> Exit Fullscreen
            </Button>
          </div>
        ) : (
          <div className="bg-muted/30 backdrop-blur-md">
            <EditorToolbar 
              editor={editor} 
              onExpand={() => setIsExpanded(true)} 
              onUpload={onUpload}
              currentMargin={margin}
              onMarginChange={setMargin}
            />
          </div>
        )}
      </div>

      {/* 2. BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* SIDEBAR */}
        {isExpanded && (
          <aside 
            className={cn(
              "bg-white dark:bg-zinc-900 border-r flex flex-col overflow-hidden transition-all duration-300",
              isSidebarOpen ? "w-[280px]" : "w-0 border-none"
            )}
          >
            <div className="p-5 w-[280px] overflow-y-auto h-full scrollbar-none pb-20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ListTree className="h-4 w-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Outline</h2>
                </div>
                {/* ✅ IMPROVED UX: Toggle button is now here at the top left */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-zinc-800" 
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              {toc.length > 0 ? (
                <div className="space-y-1 pr-2 mb-8">{renderTocItems(toc)}</div>
              ) : (
                <p className="px-3 py-4 text-xs italic text-slate-400 mb-8">Headings will appear here.</p>
              )}

              {attachments && attachments.length > 0 && (
                <>
                  <Separator className="mb-6" />
                  <div className="flex items-center gap-2 mb-4">
                    <Paperclip className="h-4 w-4 text-blue-600" />
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Attachments</h2>
                  </div>
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div key={att.tempId} className="flex items-start gap-2 text-xs p-2 rounded-md bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 group">
                        <Paperclip className="h-3 w-3 mt-0.5 text-slate-400 flex-shrink-0" />
                        <span className="flex-1 truncate text-slate-600 dark:text-slate-300" title={att.file?.name || att.tempId}>
                          {att.file?.name || att.tempId}
                        </span>
                        {onRemoveAttachment && (
                          <button 
                            type="button"
                            onClick={() => onRemoveAttachment(att.tempId)}
                            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </aside>
        )}

        {/* EDITOR */}
        <main 
          ref={scrollContainerRef}
          className={cn(
            "flex-1 overflow-y-auto scrollbar-thin transition-all bg-slate-50/50 dark:bg-zinc-950/50",
            isExpanded ? "pt-8 pb-32 px-4 relative" : "min-h-[500px] max-h-[800px]"
          )}
        >
          {isExpanded && !isSidebarOpen && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              className="fixed top-20 left-4 z-50 h-10 w-10 rounded-full border shadow-md bg-white text-blue-600" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
          )}

           {isExpanded && (
            <div className="flex justify-center sticky top-0 z-40 mb-8 pointer-events-none">
               <div className="bg-[#edf2fa] dark:bg-zinc-800 rounded-full border shadow-sm px-4 py-0.5 pointer-events-auto">
                  <EditorToolbar editor={editor} currentMargin={margin} onMarginChange={setMargin} onUpload={onUpload} />
               </div>
            </div>
           )}

          <EditorContent 
            editor={editor} 
            className={cn(
              "transition-all duration-500 ease-in-out shadow-sm mx-auto border-x border-transparent dark:border-zinc-800/50 bg-white dark:bg-zinc-900",
              "focus:outline-none prose prose-slate dark:prose-invert max-w-none pb-20 min-h-[400px]",
              "prose-p:my-1 prose-p:leading-6 prose-headings:my-3",
              isExpanded 
                ? "max-w-[850px] min-h-[1056px] rounded-sm shadow-[0_1px_3px_1px_rgba(60,64,67,.15)]" 
                : "min-h-full",
              MARGIN_OPTIONS[margin]
            )}
          >
             <EditorBubbleMenu editor={editor} />
          </EditorContent>
        </main>

        {isExpanded && (
          <div className="absolute bottom-10 right-10 z-50">
            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileSelect} />
            <Button
              type="button"
              size="icon"
              className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 text-white transition-transform active:scale-90"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Paperclip className="h-6 w-6" />}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
};