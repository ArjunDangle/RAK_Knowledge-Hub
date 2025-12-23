import { useCallback, useState } from "react";
import { Editor, EditorContent, useEditor} from "@tiptap/react";
import { BubbleMenu } from '@tiptap/react/menus'
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

interface RichTextEditorProps {
  editor: Editor | null;
}

// REPLACE YOUR EXISTING TableSelector COMPONENT WITH THIS:

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
        >
          <TableIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-64 p-3" align="start">
        {/* SECTION 1: ALWAYS VISIBLE - INSERT TABLE */}
        <div className={isTableActive ? "mb-3" : "mb-0"}>
          <div className="text-xs font-medium mb-2 text-muted-foreground">
            Insert Table {hoverRows > 0 ? `${hoverCols}x${hoverRows}` : ""}
          </div>
          
          {/* 10x10 Grid */}
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
                />
              );
            })}
          </div>

          {/* Custom Dialog Trigger */}
          <Dialog
            open={isCustomDialogOpen}
            onOpenChange={setIsCustomDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
              >
                <Grid3X3 className="mr-2 h-4 w-4" /> Insert Custom Table...
              </Button>
            </DialogTrigger>
            <DialogContent>
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

        {/* SECTION 2: EDIT EXISTING TABLE (Visible only when inside a table) */}
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
                  onClick={() => editor.chain().focus().addRowBefore().run()}
                >
                  <ArrowUp className="mr-2 h-3 w-3" /> Row Above
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-7 px-2 text-xs"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                >
                  <ArrowDown className="mr-2 h-3 w-3" /> Row Below
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-7 px-2 text-xs"
                  onClick={() => editor.chain().focus().addColumnBefore().run()}
                >
                  <ArrowLeft className="mr-2 h-3 w-3" /> Col Left
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="justify-start h-7 px-2 text-xs"
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
const Toolbar = ({ editor }: { editor: Editor }) => {
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
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
      >
        <Code className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
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
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "left" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("left").run()
        }
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "center" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("center").run()
        }
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "right" })}
        onPressedChange={() =>
          editor.chain().focus().setTextAlign("right").run()
        }
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "justify" })}
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
        onClick={setLink}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={addImage}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      <TableSelector editor={editor} />

      <Separator orientation="vertical" className="h-6 mx-1" />

      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

const TableBubbleMenu = ({ editor }: { editor: Editor }) => {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isActive('table')}
      tippyOptions={{
        duration: 100,
        placement: 'bottom-end', // <--- CHANGED: Fixes it to bottom-right of the cell
        offset: [0, 10],
        zIndex: 999,
      }}
      className="bg-transparent"
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            // CHANGED:
            // 1. Increased size (h-9 w-9)
            // 2. Removed 'cursor-grab active:cursor-grabbing' (palm hover)
            className="h-9 w-9 p-0 hover:bg-muted bg-background border shadow-sm rounded-sm"
            title="Table Options"
          >
            {/* CHANGED: Icon slightly bigger (h-5 w-5) */}
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          side="top" 
          align="end" 
          className="w-auto flex items-center gap-1 p-1 bg-background border border-border shadow-lg rounded-md"
        >
          {/* ... (The content inside PopoverContent remains the same as before) ... */}
          <div className="flex items-center gap-1 mr-2 border-r border-border pr-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              onClick={(e) => {
                e.preventDefault();
                editor.chain().focus(undefined, { scrollIntoView: false }).addColumnAfter().run();
              }}
              title="Add Column Right"
            >
              <div className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                <Columns className="h-3 w-3" />
              </div>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
              onClick={(e) => {
                e.preventDefault();
                editor.chain().focus(undefined, { scrollIntoView: false }).addRowAfter().run();
              }}
              title="Add Row Below"
            >
              <div className="flex items-center gap-1">
                <Plus className="h-3 w-3" />
                <Rows className="h-3 w-3" />
              </div>
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/20"
              onClick={(e) => {
                e.preventDefault();
                editor.chain().focus(undefined, { scrollIntoView: false }).deleteColumn().run();
              }}
              title="Delete Column"
            >
              <div className="relative">
                <Columns className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 text-[10px] font-bold text-red-500">×</span>
              </div>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-900/20"
              onClick={(e) => {
                e.preventDefault();
                editor.chain().focus(undefined, { scrollIntoView: false }).deleteRow().run();
              }}
              title="Delete Row"
            >
              <div className="relative">
                <Rows className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 text-[10px] font-bold text-red-500">×</span>
              </div>
            </Button>

            <div className="w-px h-4 bg-border mx-1" />

            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              onClick={(e) => {
                e.preventDefault();
                editor.chain().focus(undefined, { scrollIntoView: false }).deleteTable().run();
              }}
              title="Delete Entire Table"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </BubbleMenu>
  );
};

// --- 3. MAIN COMPONENT ---
export const RichTextEditor = ({ editor }: RichTextEditorProps) => {
  if (!editor) return null;

  return (
    <div className="flex flex-col border border-input rounded-md bg-background w-full overflow-hidden">
      {/* Sticky Toolbar */}
      <div className="flex-none border-b z-10 bg-muted/20">
        <Toolbar editor={editor} />
      </div>

      {/* --- ADD THIS: Table Floating Menu --- */}
      <TableBubbleMenu editor={editor} />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-[400px] max-h-[650px] bg-background">
        <EditorContent
          editor={editor}
          className="prose dark:prose-invert max-w-none p-6 focus:outline-none"
        />
      </div>
    </div>
  );
};

// --- 4. EXPORTED HOOK FOR EDITOR CONFIGURATION ---
// This fixes your "Uncaught SyntaxError" in CreatePage.tsx
// and ensures Tables, Images, and Links work correctly.
export const useConfiguredEditor = (content: string = "") => {
  return useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
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
  });
};