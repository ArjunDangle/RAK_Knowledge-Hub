import React, { useCallback, useState, useRef } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Undo, Redo,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon,
  Image as ImageIcon, FoldHorizontal, Check, Maximize2, Loader2,
  ChevronDown, Type
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Toggle } from "@/components/ui/toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MarginType } from "./RichTextEditor";
import { TableSelector } from "./TableSelector"; // FIXED: Ensure this file exists in the same folder

interface EditorToolbarProps {
  editor: Editor;
  onExpand?: () => void;
  onUpload?: (file: File) => Promise<string>;
  currentMargin?: MarginType;
  onMarginChange?: (margin: MarginType) => void;
}

const FONT_SIZES = ["8px", "10px", "12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px", "48px"];

export const EditorToolbar = ({
  editor,
  onExpand,
  onUpload,
  currentMargin,
  onMarginChange
}: EditorToolbarProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const getTextTypeLabel = () => {
    if (editor.isActive("heading", { level: 1 })) return "h1";
    if (editor.isActive("heading", { level: 2 })) return "h2";
    if (editor.isActive("heading", { level: 3 })) return "h3";
    if (editor.isActive("blockquote")) return "quote";
    return "p";
  };

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="p-1 flex flex-wrap items-center gap-0.5 bg-background overflow-x-auto scrollbar-none min-h-[40px]">
      
      {/* 1. HISTORY GROUP */}
      <div className="flex items-center">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo className="h-4 w-4" /></Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 2. TEXT TYPE DROPDOWN */}
      <Select
        value={getTextTypeLabel()}
        onValueChange={(val) => {
          if (val === "p") editor.chain().focus().setParagraph().run();
          if (val === "h1") editor.chain().focus().toggleHeading({ level: 1 }).run();
          if (val === "h2") editor.chain().focus().toggleHeading({ level: 2 }).run();
          if (val === "h3") editor.chain().focus().toggleHeading({ level: 3 }).run();
          if (val === "quote") editor.chain().focus().toggleBlockquote().run();
        }}
      >
        <SelectTrigger className="h-8 w-[120px] text-xs border-none hover:bg-muted focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="z-[200]" >
          <SelectItem value="p" className="text-xs">Normal text</SelectItem>
          <SelectItem value="h1" className="text-lg font-bold">Heading 1</SelectItem>
          <SelectItem value="h2" className="text-base font-semibold">Heading 2</SelectItem>
          <SelectItem value="h3" className="text-sm font-semibold">Heading 3</SelectItem>
          <SelectItem value="quote" className="text-xs italic">Quote</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 3. MANUAL FONT SIZE */}
      <Select
        onValueChange={(size) => (editor as any).chain().focus().setFontSize(size).run()}
      >
        <SelectTrigger className="h-8 w-[70px] text-xs border-none hover:bg-muted focus:ring-0">
          <SelectValue placeholder="16px" />
        </SelectTrigger>
        <SelectContent className="z-[250]">
          {FONT_SIZES.map(size => (
            <SelectItem key={size} value={size} className="text-xs">{size}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 4. BASIC FORMATTING */}
      <div className="flex items-center gap-0.5">
        <Toggle size="sm" pressed={editor.isActive("bold")} onMouseDown={(e) => e.preventDefault()} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Toggle>
        <Toggle size="sm" pressed={editor.isActive("italic")} onMouseDown={(e) => e.preventDefault()} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Toggle>
        <Toggle size="sm" pressed={editor.isActive("strike")} onMouseDown={(e) => e.preventDefault()} onPressedChange={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Toggle>
        <Toggle size="sm" pressed={editor.isActive("code")} onMouseDown={(e) => e.preventDefault()} onPressedChange={() => editor.chain().focus().toggleCode().run()}><Code className="h-4 w-4" /></Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 5. LISTS */}
      <div className="flex items-center gap-0.5">
        <Toggle size="sm" pressed={editor.isActive("bulletList")} onMouseDown={(e) => e.preventDefault()} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Toggle>
        <Toggle size="sm" pressed={editor.isActive("orderedList")} onMouseDown={(e) => e.preventDefault()} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Toggle>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 6. ALIGNMENT */}
      <div className="flex items-center gap-0.5">
        <Button variant={editor.isActive({ textAlign: 'left' }) ? "secondary" : "ghost"} size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="h-4 w-4" /></Button>
        <Button variant={editor.isActive({ textAlign: 'center' }) ? "secondary" : "ghost"} size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="h-4 w-4" /></Button>
        <Button variant={editor.isActive({ textAlign: 'right' }) ? "secondary" : "ghost"} size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="h-4 w-4" /></Button>
        <Button variant={editor.isActive({ textAlign: 'justify' }) ? "secondary" : "ghost"} size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify className="h-4 w-4" /></Button>
      </div>

      <Separator orientation="vertical" className="h-6 mx-1" />

      {/* 7. INSERTS */}
      <div className="flex items-center gap-0.5">
        <Button variant={editor.isActive("link") ? "secondary" : "ghost"} size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={setLink} title="Link"><LinkIcon className="h-4 w-4" /></Button>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onMouseDown={(e) => e.preventDefault()} onClick={() => fileInputRef.current?.click()}>
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </Button>
        <TableSelector editor={editor} />
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
      </div>

      {/* 8. LAYOUT & FULLSCREEN */}
      <div className="ml-auto flex items-center gap-1">
        {currentMargin && onMarginChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 px-2 gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground border-l rounded-none ml-1">
                <FoldHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{currentMargin}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-32 p-1 z-[200]" align="end">
              <div className="flex flex-col">
                {(['narrow', 'normal', 'medium', 'wide'] as MarginType[]).map((m) => (
                  <Button key={m} variant="ghost" size="sm" className="justify-between font-normal capitalize h-8 text-xs" onClick={() => onMarginChange(m)}>
                    {m} {currentMargin === m && <Check className="h-3 w-3 text-primary" />}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
        
        {onExpand && (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-colors" onClick={onExpand} title="Fullscreen">
            <Maximize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};