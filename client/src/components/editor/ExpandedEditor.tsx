import React, { useState, useEffect, useRef } from "react";
import { Editor, EditorContent } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Minimize2, 
  Save, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight,
  PanelLeft,
  ArrowLeft,
  ListTree,
  Paperclip,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditorToolbar as Toolbar } from "./EditorToolbar";
import { MARGIN_OPTIONS, MarginType } from "./RichTextEditor";
import { cn } from "@/lib/utils";

/**
 * Interface for the hierarchical Tree structure used in the Table of Contents.
 */
interface TocItem {
  id: string;
  text: string;
  level: number;
  pos: number;
  children: TocItem[];
}

interface ExpandedEditorProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isSaving?: boolean;
  margin?: MarginType;
  onMarginChange?: (margin: MarginType) => void;
  onUpload?: (file: File) => Promise<string>;
}

export const ExpandedEditor = ({ 
  editor, 
  isOpen, 
  onClose, 
  title, 
  isSaving,
  margin = "normal",
  onMarginChange,
  onUpload
}: ExpandedEditorProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Logic: Identifies which heading is currently visible to the user.
   */
  useEffect(() => {
    if (!isOpen || toc.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { 
        root: scrollContainerRef.current, 
        rootMargin: "-10% 0px -70% 0px" // Trigger when section is in top viewport
      }
    );

    const headingElements = document.querySelectorAll(".prose h1, .prose h2, .prose h3");
    headingElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [toc, isOpen]);

  /**
   * Tree Transformation: Converts flat Tiptap nodes into a nested JSON structure.
   */
  const buildTocTree = (headings: {text: string, level: number, pos: number}[]) => {
    const root: TocItem[] = [];
    const stack: TocItem[] = [];

    headings.forEach((h, index) => {
      const id = `heading-${h.pos}`;
      const newItem: TocItem = { ...h, id, children: [] };
      
      while (stack.length > 0 && stack[stack.length - 1].level >= h.level) {
        stack.pop();
      }

      if (stack.length === 0) {
        root.push(newItem);
      } else {
        stack[stack.length - 1].children.push(newItem);
      }
      stack.push(newItem);
    });
    return root;
  };

  /**
   * Logic: Synchronizes the outline with content changes in real-time.
   */
  useEffect(() => {
    if (!editor) return;

    const updateToc = () => {
      const flatHeadings: any[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          node.attrs.id = `heading-${pos}`; 
          flatHeadings.push({
            text: node.textContent,
            level: node.attrs.level,
            pos: pos,
          });
        }
      });
      setToc(buildTocTree(flatHeadings));
    };

    updateToc();
    editor.on("update", updateToc);
    return () => { editor.off("update", updateToc); };
  }, [editor]);

  /**
   * Logic: Smooth scroll to specific document positions.
   */
  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    editor.commands.focus(pos);
    const id = `heading-${pos}`;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /**
   * Logic: Mirror the standard editor's file upload handling.
   */
  // Inside ExpandedEditor.tsx

// Inside ExpandedEditor.tsx

const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !onUpload || !editor) return;

  try {
    setIsUploading(true);
    const url = await onUpload(file);

    // Logic: Insert the correct node/mark based on file type
    if (file.type.startsWith('image/')) {
      // Use setImage to render the visual image on the current line
      editor.chain().focus().setImage({ src: url, alt: file.name }).run();
    } else {
      // For PDFs or Videos, insert a styled "Attachment Chip" link on the current line
      // This ensures it appears in the text flow, not just in the bottom list
      editor
        .chain()
        .focus()
        .insertContent(` <a href="${url}" class="attachment-chip" target="_blank">📎 ${file.name}</a> `)
        .run();
    }
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

  /**
   * Recursive TOC Component.
   */
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
            onClick={() => scrollToHeading(item.pos)}
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

            <span className={cn(
              "truncate text-[13px] flex-1",
              item.level === 1 ? "font-semibold" : "font-normal"
            )}>
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex flex-col bg-[#F9FBFD] dark:bg-zinc-950 font-sans"
        >
          {/* HEADER */}
          <header className="flex items-center justify-between px-4 py-1.5 bg-white dark:bg-zinc-900 border-b shrink-0 h-14">
            <div className="flex items-center gap-3 flex-1">
              <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0 rounded-full">
                <ArrowLeft className="h-5 w-5 text-slate-600" />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-[18px] font-normal text-slate-900 dark:text-slate-100 truncate max-w-[400px]">
                  {title}
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
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-full px-6 gap-2">
              <Minimize2 className="h-4 w-4" /> Exit Fullscreen
            </Button>
          </header>

          <div className="flex flex-1 overflow-hidden">
            {/* OUTLINE SIDEBAR */}
            <motion.aside
              initial={false}
              animate={{ width: isSidebarOpen ? 280 : 0 }}
              className="bg-white dark:bg-zinc-900 border-r flex flex-col overflow-hidden relative"
            >
              <div className="p-5 w-[280px] overflow-y-auto h-full scrollbar-none">
                <div className="flex items-center gap-2 mb-6">
                  <ListTree className="h-4 w-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Outline</h2>
                </div>
                {toc.length > 0 ? (
                  <div className="space-y-1 pr-2">{renderTocItems(toc)}</div>
                ) : (
                  <p className="px-3 py-4 text-xs italic text-slate-400">Headings will appear here.</p>
                )}
              </div>
              <Button variant="ghost" size="sm" className="absolute bottom-6 right-3 h-8 w-8 rounded-full border bg-white shadow-sm" onClick={() => setIsSidebarOpen(false)}>
                <ChevronLeft className="h-4 w-4 text-slate-600" />
              </Button>
            </motion.aside>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
              {!isSidebarOpen && (
                <Button variant="ghost" size="sm" className="absolute top-4 left-4 z-50 h-10 w-10 rounded-full border shadow-md bg-white text-blue-600" onClick={() => setIsSidebarOpen(true)}>
                  <PanelLeft className="h-5 w-5" />
                </Button>
              )}

              {/* FLOATING PILL TOOLBAR */}
              <div className="flex justify-center bg-[#F9FBFD] dark:bg-zinc-950 border-b py-2.5 px-4 shrink-0">
                <div className="max-w-[1000px] w-full bg-[#edf2fa] dark:bg-zinc-800 rounded-full border shadow-sm px-4 py-0.5">
                  <Toolbar editor={editor} currentMargin={margin} onMarginChange={onMarginChange} />
                </div>
              </div>

              {/* CANVAS */}
              <main ref={scrollContainerRef} className="flex-1 overflow-y-auto pt-8 pb-32 px-4 scrollbar-thin">
                <div className="max-w-[850px] mx-auto relative">
                  <div className="bg-white dark:bg-zinc-900 shadow-[0_1px_3px_1px_rgba(60,64,67,.15)] min-h-[1056px] rounded-sm border border-transparent dark:border-zinc-800 transition-all">
                    <EditorContent
                      editor={editor}
                      className={cn("prose prose-slate dark:prose-invert max-w-none focus:outline-none", MARGIN_OPTIONS[margin])}
                    />
                  </div>
                </div>
              </main>

              {/* STICKY ATTACHMENT FAB */}
              <div className="absolute bottom-10 right-10 z-50">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full shadow-2xl bg-blue-600 hover:bg-blue-700 text-white transition-transform active:scale-90"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Paperclip className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};