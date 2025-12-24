import React, { useCallback, useState } from "react";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Grid3X3,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Columns,
  Rows,
  Trash,
  GripVertical,
  Maximize2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

// Import the ExpandedEditor component
import { ExpandedEditor } from "./ExpandedEditor";

interface RichTextEditorProps {
  editor: Editor | null;
  title?: string;
}

// --- 1. TABLE SELECTOR COMPONENT (Logic Preserved) ---
const TableSelector = ({ editor }: { editor: Editor }) => {
  const [hoverRows, setHoverRows] = useState(0);
  const [hoverCols, setHoverCols] = useState(0);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [isOpen, setIsOpen] = useState(false);

  const insertTable = (rows: number, cols: number) => {
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
    setIsOpen(false);
    setIsCustomDialogOpen(false);
    setHoverRows(0);
    setHoverCols(0);
  };

  const isTableActive = editor.can().deleteTable();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={isTableActive ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          title="Table Operations"
          // FIX: Prevent the editor from losing focus when the popover trigger is clicked
          onMouseDown={(e) => e.preventDefault()}
        >
          <TableIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        className="w-64 p-3 z-[110]" // Higher z-index for expanded mode
        align="start"
        // FIX: Keep focus in editor even when interacting with the grid
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className={isTableActive ? "mb-3" : "mb-0"}>
          <div className="text-xs font-medium mb-2 text-muted-foreground">
            Insert Table {hoverRows > 0 ? `${hoverCols}x${hoverRows}` : ""}
          </div>
          
          <div
            className="grid gap-1 mb-3"
            style={{ gridTemplateColumns: "repeat(10, 1fr)" }}
            onMouseLeave={() => {
              setHoverRows(0);
              setHoverCols(0);
            }}
          >
            {Array.from({ length: 100 }).map((_, i) => {
              const row = Math.floor(i / 10) + 1;
              const col = (i % 10) + 1;
              const isActive = row <= hoverRows && col <= hoverCols;

              return (
                <button
                  key={i}
                  className={`w-4 h-4 border rounded-sm transition-colors ${
                    isActive
                      ? "bg-primary border-primary"
                      : "bg-muted border-muted-foreground/20"
                  }`}
                  onMouseEnter={() => {
                    setHoverRows(row);
                    setHoverCols(col);
                  }}
                  onClick={() => insertTable(row, col)}
                  onMouseDown={(e) => e.preventDefault()} // FIX
                />
              );
            })}
          </div>

          <Dialog
            open={isCustomDialogOpen}
            onOpenChange={setIsCustomDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onMouseDown={(e) => e.preventDefault()} // FIX
              >
                <Grid3X3 className="mr-2 h-4 w-4" /> Insert Custom Table...
              </Button>
            </DialogTrigger>
            <DialogContent className="z-[120]"> {/* Ensure it sits above the expanded view */}
              <DialogHeader>
                <DialogTitle>Insert Table</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Columns</Label>
                  <Input
                    type="number"
                    min={1}
                    value={customCols}
                    onChange={(e) => setCustomCols(parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rows</Label>
                  <Input
                    type="number"
                    min={1}
                    value={customRows}
                    onChange={(e) => setCustomRows(parseInt(e.target.value))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => insertTable(customRows, customCols)}>
                  Insert Table
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isTableActive && (
          <>
            <Separator className="my-3" />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-muted-foreground mb-1">
                Edit Current Table
              </div>

              <div className="grid grid-cols-2 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-7 px-2 text-xs"
                  onMouseDown={(e) => e.preventDefault()} // FIX
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                >
                  <ArrowUp className="mr-2 h-3 w-3" /> Row Above
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-7 px-2 text-xs"
                  onMouseDown={(e) => e.preventDefault()} // FIX
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                >
                  <ArrowDown className="mr-2 h-3 w-3" /> Row Below
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-7 px-2 text-xs"
                  onMouseDown={(e) => e.preventDefault()} // FIX
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                >
                  <ArrowLeft className="mr-2 h-3 w-3" /> Col Left
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-7 px-2 text-xs"
                  onMouseDown={(e) => e.preventDefault()} // FIX
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                >
                  <ArrowRight className="mr-2 h-3 w-3" /> Col Right
                </Button>
              </div>

              <div className="border-t mt-2 pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start w-full h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onMouseDown={(e) => e.preventDefault()} // FIX
                  onClick={() => editor.chain().focus().deleteTable().run()}
                >
                  <Trash2 className="mr-2 h-3 w-3" /> Delete Table
                </Button>
              </div>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

// --- 2. TOOLBAR COMPONENT ---
export const Toolbar = ({ editor, onExpand }: { editor: Editor; onExpand?: () => void }) => {
  const addImage = useCallback(() => {
    const url = window.prompt("URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  }, [editor]);

  return (
    <div className="p-2 flex flex-wrap items-center gap-1 bg-background">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("code")}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "left" })}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "center" })}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "right" })}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "justify" })}
        onMouseDown={(e) => e.preventDefault()} // FIX
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("justify").run()
        }
      >
        <AlignJustify className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant={editor.isActive("link") ? "secondary" : "ghost"}
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={(e) => e.preventDefault()} // FIX
        onClick={setLink}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={(e) => e.preventDefault()} // FIX
        onClick={addImage}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      {/* Table Selector is rendered here */}
      <TableSelector editor={editor} />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={(e) => e.preventDefault()} // FIX
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onMouseDown={(e) => e.preventDefault()} // FIX
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>

      {onExpand && (
        <>
          <Separator orientation="vertical" className="h-6 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 ml-auto"
            onClick={onExpand}
            title="Expand to Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
};

// --- 3. BUBBLE MENU COMPONENT ---
const TableBubbleMenu = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isActive('table')}
      tippyOptions={{
        duration: 100,
        placement: 'bottom-end',
        offset: [0, 10],
        zIndex: 110, // Higher z-index
      }}
      className="bg-transparent"
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-muted bg-background border shadow-sm rounded-sm"
            title="Table Options"
            onMouseDown={(e) => e.preventDefault()} // FIX
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          side="top" 
          align="end" 
          className="w-auto flex items-center gap-1 p-1 bg-background border border-border shadow-lg rounded-md z-[115]"
          onOpenAutoFocus={(e) => e.preventDefault()} // FIX
        >
          <div className="flex items-center gap-1 mr-2 border-r border-border pr-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                editor.chain().focus(undefined, { scrollIntoView: false }).addColumnAfter().run();
              }}
            >
              <Plus className="h-3 w-3" />
              <Columns className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                editor.chain().focus(undefined, { scrollIntoView: false }).addRowAfter().run();
              }}
            >
              <Plus className="h-3 w-3" />
              <Rows className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                editor.chain().focus(undefined, { scrollIntoView: false }).deleteTable().run();
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </BubbleMenu>
  );
};

// --- 4. MAIN COMPONENT (Sync Fix) ---
export const RichTextEditor = ({ editor, title }: RichTextEditorProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!editor) return null;

  return (
    <div className="relative">
      {/* Logic: Only mount the small editor if not expanded. 
         This ensures the editor instance is cleanly moved to the large view.
      */}
      {!isExpanded ? (
        <div className="flex flex-col border border-input rounded-md bg-background w-full overflow-hidden">
          <div className="flex-none border-b z-10 bg-muted/20">
            <Toolbar editor={editor} onExpand={() => setIsExpanded(true)} />
          </div>

          <TableBubbleMenu editor={editor} />

          <div className="flex-1 overflow-y-auto min-h-[400px] max-h-[650px] bg-background text-foreground">
            <EditorContent
              key="small"
              editor={editor}
              className="prose dark:prose-invert max-w-none p-6 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <ExpandedEditor 
          editor={editor} 
          isOpen={isExpanded} 
          onClose={() => {
            setIsExpanded(false);
            // Small delay to ensure the DOM is ready for focus
            setTimeout(() => editor.commands.focus(), 50);
          }} 
          title={title || ""} 
        />
      )}
    </div>
  );
};

// --- 5. EXPORTED HOOK ---
export const useConfiguredEditor = (content: string = "", onUpload?: any, onUpdate?: (editor: Editor) => void) => {
  return useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[150px]',
      },
    },
    content,
    onUpdate: ({ editor }) => {
      if (onUpdate) onUpdate(editor);
    },
  });
};