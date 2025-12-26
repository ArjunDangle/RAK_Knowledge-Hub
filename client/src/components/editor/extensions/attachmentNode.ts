import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { AttachmentComponent } from './AttachmentComponent';

export const AttachmentNode = Node.create({
  name: 'attachmentNode',
  group: 'block',
  atom: true,
  draggable: true, // ✅ Enables Dragging behavior

  addAttributes() {
    return {
      'data-file-name': { default: null },
      'data-attachment-type': { default: 'file' },
      'data-temp-id': { default: null },
      
      // ✅ NEW: Stores the Base64 image data
      src: { default: null }, 
      
      // ✅ NEW: Stores dimensions for resizing
      width: { default: '100%' },
      height: { default: 'auto' },
    };
  },

  parseHTML() {
    return [
      // 1. Standard Node Parser (Used by Editor)
      {
        tag: 'div[data-attachment-type]',
        getAttrs: (node) => {
          if (typeof node === 'string') return {};
          const el = node as HTMLElement;
          return {
            'data-file-name': el.getAttribute('data-file-name'),
            'data-attachment-type': el.getAttribute('data-attachment-type'),
            'data-temp-id': el.getAttribute('data-temp-id'),
            'src': el.getAttribute('src'),
            // Parse dimensions from style or attributes
            width: el.style.width || el.getAttribute('width'),
            height: el.style.height || el.getAttribute('height'),
          };
        },
      },

      // 2. Legacy: Confluence Video Wrapper (Preserved from your old file)
      {
        tag: 'span.confluence-embedded-file-wrapper',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const el = element as HTMLElement;
          const link = el.querySelector('a');
          const href = link?.getAttribute('href');
          
          if (!href) return false;

          const videoExtensions = ['.mp4', '.mov', '.avi', '.webm'];
          const isVideo = videoExtensions.some(ext => href.toLowerCase().includes(ext));

          if (!isVideo) return false;

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

      // 3. Legacy: Confluence PDF Macro (Preserved from your old file)
      {
        tag: 'div[data-macro-name="viewpdf"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return false;
          const el = element as HTMLElement;
          const attachmentElement = el.querySelector('div[data-attachment-name]');
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
    // ✅ Renders width/height into the style string so Tiptap saves the resized state
    return ['div', mergeAttributes(HTMLAttributes, {
      style: `width: ${HTMLAttributes.width}; height: ${HTMLAttributes.height};`
    })];
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

// TypeScript declaration to fix type errors when using editor.commands.setAttachment
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    attachmentNode: {
      setAttachment: (options: { 
        'data-file-name': string; 
        'data-attachment-type': string;
        'data-temp-id'?: string;
        'src'?: string;
        'width'?: string;
        'height'?: string;
      }) => ReturnType;
    };
  }
}