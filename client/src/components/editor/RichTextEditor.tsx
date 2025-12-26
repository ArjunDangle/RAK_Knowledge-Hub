import React, { useState } from "react";
import { Editor, EditorContent } from "@tiptap/react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { ExpandedEditor } from "./ExpandedEditor";
import { cn } from "@/lib/utils";

/**
 * Professional Margin Presets.
 * These are passed to both the standard view and the expanded view to ensure
 * consistency in the document's visual layout.
 */
export const MARGIN_OPTIONS = {
  narrow: "p-4",
  normal: "p-8",
  medium: "p-14",
  wide: "p-24",
};

export type MarginType = keyof typeof MARGIN_OPTIONS;

interface RichTextEditorProps {
  editor: Editor | null;
  title?: string;
  onUpload?: (file: File) => Promise<string>;
  isSaving?: boolean;
}

/**
 * RichTextEditor: The primary container for the RAK Knowledge Hub writing experience.
 * It manages the transition between standard and fullscreen document modes.
 */
export const RichTextEditor = ({ 
  editor, 
  title, 
  onUpload, 
  isSaving 
}: RichTextEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [margin, setMargin] = useState<MarginType>("normal");

  // Safety check: Prevents rendering errors during the Tiptap initialization phase.
  if (!editor) {
    return (
      <div className="w-full h-[450px] border rounded-md bg-muted/5 animate-pulse flex items-center justify-center">
        <span className="text-muted-foreground text-sm font-medium italic tracking-wide">
          Initializing Editor Engine...
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full group selection:bg-blue-100 selection:text-blue-900">
      {!isExpanded ? (
        /* --- STANDARD DOCUMENT MODE --- */
        <div className="flex flex-col border border-slate-200 dark:border-zinc-800 rounded-lg bg-background w-full overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ring-1 ring-black/5">
          
          {/* 1. Header Area: Toolbar with formatting and layout controls */}
          <div className="flex-none border-b border-border/60 z-10 bg-muted/30 backdrop-blur-md">
            <EditorToolbar 
              editor={editor} 
              onExpand={() => setIsExpanded(true)} 
              onUpload={onUpload}
              currentMargin={margin}
              onMarginChange={setMargin}
            />
          </div>

          {/* 2. Contextual Menus: Floating controls for tables, links, and text formatting */}
          <EditorBubbleMenu editor={editor} />

          {/* 3. Main Editor Area:
              - Outer div: The "Desk" with a subtle background.
              - Inner div: The "Paper" with dynamic padding based on margin state.
          */}
          <div className="flex-1 overflow-y-auto min-h-[500px] max-h-[800px] bg-slate-50/50 dark:bg-zinc-950/50 scrollbar-thin">
            <div 
              className={cn(
                "bg-white dark:bg-zinc-900 min-h-full transition-all duration-500 ease-in-out shadow-sm mx-auto max-w-[850px] border-x border-transparent dark:border-zinc-800/50",
                MARGIN_OPTIONS[margin]
              )}
            > 
              <EditorContent 
                editor={editor} 
                className="focus:outline-none prose prose-slate dark:prose-invert max-w-none pb-20" 
              />
            </div>
          </div>
          
          {/* 4. Footer: Displays system status and saving indicators */}
          
        </div>
      ) : (
        /* --- FULLSCREEN DOCS MODE --- */
        <ExpandedEditor 
          editor={editor} 
          isOpen={isExpanded} 
          onClose={() => { 
            setIsExpanded(false); 
            // Logic: Smoothly refocus the editor after the transition to maintain workflow.
            setTimeout(() => editor.commands.focus(), 150); 
          }} 
          title={title || "Untitled Document"}
          isSaving={isSaving}
          margin={margin}
          onMarginChange={setMargin}
        />
      )}
    </div>
  );
};