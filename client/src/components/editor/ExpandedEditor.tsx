import React from "react";
import { Editor, EditorContent } from "@tiptap/react";
import { motion, AnimatePresence } from "framer-motion";
import { Minimize2, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Toolbar } from "./RichTextEditor"; // We'll export Toolbar from your main editor file

interface ExpandedEditorProps {
  editor: Editor | null;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  isSaving?: boolean;
}

export const ExpandedEditor = ({ editor, isOpen, onClose, title, isSaving }: ExpandedEditorProps) => {
  if (!editor) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 z-[100] flex flex-col bg-slate-100 dark:bg-zinc-950"
        >
          {/* 1. Google Docs Style Top Header */}
          <header className="flex items-center justify-between px-6 py-3 bg-white dark:bg-zinc-900 border-b shadow-sm shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
                R
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground line-clamp-1 max-w-[300px]">
                  {title || "Untitled Article"}
                </h1>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  {isSaving ? (
                    <span className="flex items-center gap-1">
                      <Save className="h-3 w-3 animate-pulse" /> Saving...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-success">
                      <CheckCircle className="h-3 w-3" /> Saved to Hub
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onClose} className="gap-2">
                <Minimize2 className="h-4 w-4" />
                Exit Fullscreen
              </Button>
            </div>
          </header>

          {/* 2. Sticky Toolbar Container */}
          <div className="sticky top-0 z-20 flex justify-center bg-slate-50 dark:bg-zinc-900/50 border-b py-1 px-4">
            <div className="max-w-[1000px] w-full bg-white dark:bg-zinc-800 rounded-md border shadow-sm px-2">
               <Toolbar editor={editor} />
            </div>
          </div>

          {/* 3. The "Canvas" - Scrollable area */}
          <main className="flex-1 overflow-y-auto pt-8 pb-20 px-4 scrollbar-thin">
            <div className="max-w-[816px] mx-auto">
              {/* The "Sheet of Paper" */}
              <div className="bg-white dark:bg-zinc-900 shadow-xl border border-black/5 min-h-[1056px] rounded-sm transition-all duration-300">
                <EditorContent
                  editor={editor}
                  className="prose prose-slate dark:prose-invert max-w-none p-[60px] md:p-[80px] focus:outline-none"
                />
              </div>
              
              <div className="mt-8 text-center text-xs text-muted-foreground">
                RAKwireless Knowledge Hub Editor • End of Document
              </div>
            </div>
          </main>
        </motion.div>
      )}
    </AnimatePresence>
  );
};