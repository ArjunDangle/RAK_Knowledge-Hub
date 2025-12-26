// client/src/components/editor/extensions/attachmentNode.ts
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AttachmentComponent } from './AttachmentComponent';

export const AttachmentNode = Node.create({
  name: 'attachmentNode',
  group: 'block',
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      'data-file-name': { default: null },
      'data-attachment-type': { default: 'file' },
      'src': { default: null }, // ADD THIS LINE
      'data-temp-id': { default: null }, // ADD THIS LINE
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-attachment-type]',
        getAttrs: el => ({
        'data-temp-id': el.getAttribute('data-temp-id'), // ADD THIS LINE
        'data-file-name': el.getAttribute('data-file-name'),
        'data-attachment-type': el.getAttribute('data-attachment-type'),
      })

        
      },

      {
        tag: 'span.confluence-embedded-file-wrapper',
        getAttrs: (element: HTMLElement) => {
          const link = element.querySelector('a');
          const href = link?.getAttribute('href');
          if (!href) {
            return false;
          }

          const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
          const isVideo = videoExtensions.some(ext => href.toLowerCase().includes(ext));

          if (!isVideo) {
            return false;
          }

          try {
            const urlParts = href.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            const fileName = decodeURIComponent(lastPart.split('?')[0]);
            return {
              'data-file-name': fileName,
              'data-attachment-type': 'video',
            };
          } catch (e) {
            console.error("Failed to parse attachment filename from href:", href, e);
            return false;
          }
        },
      },
      {
        tag: 'div[data-macro-name="viewpdf"]',
        getAttrs: (element: HTMLElement) => {
          const attachmentElement = element.querySelector('div[data-attachment-name]');
          const fileName = attachmentElement?.getAttribute('data-attachment-name');

          if (fileName) {
            return {
              'data-file-name': fileName,
              'data-attachment-type': 'pdf',
            };
          }
          
          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div', 
      mergeAttributes(HTMLAttributes, {
        style: 'border: 1px solid #e2e8f0; padding: 0.5rem; border-radius: 0.5rem; background-color: #f8fafc; min-height: 40px;'
      })
    ];
  },

  addNodeView() {
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

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    attachmentNode: {
      setAttachment: (options: { 'data-file-name': string; 'data-attachment-type': string }) => ReturnType;
    }
  }
}