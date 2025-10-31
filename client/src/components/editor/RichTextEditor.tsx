// client/src/components/editor/RichTextEditor.tsx
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { 
    Bold, Italic, Strikethrough, List, ListOrdered, Quote, Table2, Link as LinkIcon, 
    Underline, Palette, Highlighter, AlignLeft, ListTodo, RemoveFormatting, ChevronDown
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { AttachmentNode } from './extensions/attachmentNode';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { Separator } from '@/components/ui/separator';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import TiptapUnderline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';
import { useCallback, useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';

interface RichTextEditorProps {
  editor: Editor | null;
}

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
      if (!editor) return;
      const updateHandler = () => setForceUpdate(val => val + 1);
      editor.on('update', updateHandler);
      editor.on('selectionUpdate', updateHandler);
      return () => {
          editor.off('update', updateHandler);
          editor.off('selectionUpdate', updateHandler);
      };
  }, [editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setIsLinkPopoverOpen(false);
      return;
    }
    let finalUrl = linkUrl;
    if (!/^https?:\/\//i.test(linkUrl)) {
      finalUrl = 'https://' + linkUrl;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: finalUrl }).run();
    setIsLinkPopoverOpen(false);
    setLinkUrl('');
  }, [editor, linkUrl]);

  if (!editor) {
    return null;
  }
  
  const handleLinkPopoverOpen = () => {
    setLinkUrl(editor.getAttributes('link').href || '');
    setIsLinkPopoverOpen(true);
  }

  const StyleDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-32 justify-between text-left font-normal">
          <span className="truncate">
            { editor.isActive('heading', { level: 1 }) ? 'Heading 1' :
              editor.isActive('heading', { level: 2 }) ? 'Heading 2' :
              editor.isActive('heading', { level: 3 }) ? 'Heading 3' :
              'Normal text' }
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => editor.chain().focus().setParagraph().run()}>Normal text</DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>Heading 1</DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>Heading 2</DropdownMenuItem>
        <DropdownMenuItem onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>Heading 3</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="border border-input rounded-t-md p-1 flex flex-wrap items-center gap-0.5">
        <StyleDropdown />
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Toggle size="sm" title="Bold" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Toggle>
        <Toggle size="sm" title="Italic" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Toggle>
        <Toggle size="sm" title="Underline" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()}><Underline className="h-4 w-4" /></Toggle>
        <Toggle size="sm" title="Strikethrough" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="h-4 w-4" /></Toggle>
        <label className="flex items-center cursor-pointer p-1.5 rounded-md hover:bg-muted" title="Text Color"><Palette className="h-4 w-4" /><input type="color" value={editor.getAttributes('textStyle').color || '#000000'} onChange={e => editor.chain().focus().setColor(e.target.value).run()} className="w-0 h-0 p-0 border-0 overflow-hidden" /></label>
        <Toggle size="sm" title="Highlight" pressed={editor.isActive('highlight')} onPressedChange={() => editor.chain().focus().toggleHighlight().run()}><Highlighter className="h-4 w-4" /></Toggle>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
          <PopoverTrigger asChild>
              <Toggle size="sm" title="Link" pressed={editor.isActive('link')} onClick={handleLinkPopoverOpen}><LinkIcon className="h-4 w-4" /></Toggle>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2"><h4 className="font-medium leading-none">Set Link URL</h4><p className="text-sm text-muted-foreground">Enter the full URL, including https://</p></div>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" />
              <Button onClick={setLink}>Set Link</Button>
            </div>
          </PopoverContent>
        </Popover>
        <Toggle size="sm" title="Blockquote" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Toggle>
        <Toggle size="sm" title="Clear Formatting" onPressedChange={() => editor.chain().focus().unsetAllMarks().run()}><RemoveFormatting className="h-4 w-4" /></Toggle>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" title="Alignment"><AlignLeft className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('left').run()}>Align Left</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('center').run()}>Align Center</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('right').run()}>Align Right</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().setTextAlign('justify').run()}>Align Justify</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" title="Lists"><List className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullet List</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleOrderedList().run()}>Numbered List</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().toggleTaskList().run()}>Task List</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => editor.chain().focus().sinkListItem('listItem').run()} disabled={!editor.can().sinkListItem('listItem')}>Indent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => editor.chain().focus().liftListItem('listItem').run()} disabled={!editor.can().liftListItem('listItem')}>Outdent</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" title="Table"><Table2 className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Insert Table</DropdownMenuItem>
                {editor.isActive("table") && <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>Add Column Before</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>Add Column After</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()}>Delete Column</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>Add Row Before</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>Add Row After</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()}>Delete Row</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().mergeCells().run()}>Merge Cells</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => editor.chain().focus().splitCell().run()}>Split Cell</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} className="text-red-600">Delete Table</DropdownMenuItem>
                </>}
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
  );
};


export const RichTextEditor = ({ editor }: RichTextEditorProps) => {
    return (
        <div>
            {editor && <Toolbar editor={editor} />}
            <EditorContent 
                editor={editor} 
                className="prose dark:prose-invert max-w-none border border-input rounded-b-md p-4 min-h-[300px] focus:outline-none" 
            />
        </div>
    );
};

export const useConfiguredEditor = (
  initialContent: string = "",
  onFileUpload: (file: File) => void
) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TiptapUnderline,
            TextStyle, // Keep for color, etc.
            // FontFamily removed
            Color,
            Highlight.configure({ multicolor: true }),
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Image.configure({
                inline: false,
            }),
            AttachmentNode,
            Table.configure({
              resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'focus:outline-none',
            },
            handlePaste: (view, event) => {
                const files = event.clipboardData?.files;
                if (!files || files.length === 0) {
                    return false; 
                }

                let imagePasted = false;
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    if (file.type.startsWith("image/")) {
                        imagePasted = true;
                        onFileUpload(file);
                    }
                }

                return imagePasted;
            },
        },
    });

    return editor;
};