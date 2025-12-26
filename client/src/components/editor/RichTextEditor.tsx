import React, { useState } from "react";
import { Editor, EditorContent } from "@tiptap/react";
import { EditorToolbar } from "./EditorToolbar";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { ExpandedEditor } from "./ExpandedEditor";
import { cn } from "@/lib/utils";

export const MARGIN_OPTIONS = {
  narrow: "p-4",
  normal: "p-8",
  medium: "p-14",
  wide: "p-24",
};

export type MarginType = keyof typeof MARGIN_OPTIONS;

// 1. Make sure this interface is exported so ExpandedEditor can use it
export interface EditorAttachment {
  file: File;
  tempId: string;
  type: "image" | "video" | "pdf" | "file";
}

interface RichTextEditorProps {
  editor: Editor | null;
  title?: string;
  onUpload?: (file: File) => Promise<string>;
  isSaving?: boolean;
  // 2. ADD THESE PROPS HERE
  attachments?: EditorAttachment[];
  onRemoveAttachment?: (tempId: string) => void;
}

export const RichTextEditor = ({ 
  editor, 
  title, 
  onUpload, 
  isSaving,
  // 3. Destructure them here
  attachments = [], 
  onRemoveAttachment
  
}: RichTextEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [margin, setMargin] = useState<MarginType>("normal");

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
          <div className="flex-none border-b border-border/60 z-10 bg-muted/30 backdrop-blur-md">
            <EditorToolbar 
              editor={editor} 
              onExpand={() => setIsExpanded(true)} 
              onUpload={onUpload}
              currentMargin={margin}
              onMarginChange={setMargin}
            />
          </div>
          <EditorBubbleMenu editor={editor} />
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
        </div>
      ) : (
        /* --- FULLSCREEN DOCS MODE --- */
        <ExpandedEditor 
          editor={editor} 
          isOpen={isExpanded} 
          onClose={() => { 
            setIsExpanded(false); 
            setTimeout(() => editor.commands.focus(), 150); 
          }} 
          title={title || "Untitled Document"}
          isSaving={isSaving}
          margin={margin}
          onMarginChange={setMargin}
          onUpload={onUpload}
          // 4. PASS THEM DOWN HERE
          attachments={attachments}
          onRemoveAttachment={onRemoveAttachment}
        />
      )}
    </div>
  );
};
