// client/src/components/editor/RichTextEditor.tsx
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { AttachmentNode } from './extensions/attachmentNode'; // Import the new custom node

interface RichTextEditorProps {
  editor: Editor | null;
}

const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input rounded-md p-1 flex flex-wrap gap-1 mb-2">
      <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="h-4 w-4" />
      </Toggle>
    </div>
  );
};

export const RichTextEditor = ({ editor }: RichTextEditorProps) => {
    return (
        <div>
            {editor && <Toolbar editor={editor} />}
            <EditorContent 
                editor={editor} 
                className="prose dark:prose-invert max-w-none border border-input rounded-md p-4 min-h-[300px]" 
            />
        </div>
    );
};

export const useConfiguredEditor = (initialContent: string = '') => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image.configure({
                inline: false,
            }),
            AttachmentNode, // Use the new custom node extension
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'focus:outline-none',
            },
        },
    });

    return editor;
};