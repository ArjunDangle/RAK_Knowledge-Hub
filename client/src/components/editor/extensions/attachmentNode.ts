// client/src/components/editor/extensions/attachmentNode.ts
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AttachmentComponent } from './AttachmentComponent';

export const AttachmentNode = Node.create({
  name: 'attachmentNode',
  group: 'block',
  atom: true, // Treat as a single, indivisible unit
  draggable: true,

  addAttributes() {
    return {
      'data-file-name': { default: null },
      'data-attachment-type': { default: 'file' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-attachment-type]' }];
  },

  renderHTML({ HTMLAttributes }) {
    // This is the HTML that will be saved in the final output
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    // This is the React component that will be rendered in the editor
    return ReactNodeViewRenderer(AttachmentComponent);
  },
  
  addCommands() {
    return {
      setAttachment: (options) => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    };
  },
});

// Augment the TipTap commands to include our new command
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    attachmentNode: {
      setAttachment: (options: { 'data-file-name': string; 'data-attachment-type': string }) => ReturnType;
    }
  }
}