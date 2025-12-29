import { Editor, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TextStyle } from '@tiptap/extension-text-style'
import { Extension, CommandProps } from "@tiptap/core";
import { AttachmentNode } from "./extensions/attachmentNode";

export const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize: (fontSize: string) => ({ chain }: CommandProps) => 
        chain().setMark('textStyle', { fontSize }).run(),
      unsetFontSize: () => ({ chain }: CommandProps) => 
        chain().setMark('textStyle', { fontSize: null }).run(),
    };
  },
});

/**
 * Main Editor Configuration Hook
 * @param content - Initial HTML content for the editor
 * @param onUpdate - Callback triggered on every content change
 */
// client/src/components/editor/useEditorConfig.ts

export const useConfiguredEditor = (content: string = "", onUpdate?: (editor: Editor) => void) => {
  return useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      
      AttachmentNode,
      
      // FIX: Enable Base64 to show uploaded images immediately
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto border shadow-sm my-4 inline-block',
        },
      }),

      // FIX: Configure Link to support the 'attachment-chip' style for PDFs/Videos
      Link.configure({ 
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),

      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell, TextStyle, FontSize,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[400px] pb-20',
      },
    },
    content,
    onUpdate: ({ editor }) => { if (onUpdate) onUpdate(editor); },
  });
};