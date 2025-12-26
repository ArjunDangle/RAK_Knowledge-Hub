// client/src/components/editor/extensions/AttachmentComponent.tsx
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Paperclip } from 'lucide-react';

export const AttachmentComponent = ({ node }: NodeViewProps) => {
  const { 'data-file-name': fileName, 'data-attachment-type': fileType } = node.attrs;

  return (
    <NodeViewWrapper className="not-prose w-full"> {/* ✅ Added w-full */}
      <div
        className="flex items-center gap-2 bg-muted rounded-lg p-2 my-2 border border-border cursor-default select-none w-full"
        draggable="true"
        data-drag-handle
      >
        <div className="flex-shrink-0 bg-muted-foreground/20 p-2 rounded-md">
          <Paperclip className="h-4 w-4 text-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground capitalize">{fileType} Attachment</p>
        </div>
      </div>
    </NodeViewWrapper>
  );
};