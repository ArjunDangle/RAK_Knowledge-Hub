import React, { useState, useRef } from 'react';
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import { Paperclip, FileText, FileVideo, MoveDiagonal, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export const AttachmentComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const { 
    'data-file-name': fileName, 
    'data-attachment-type': fileType,
    src,
    width 
  } = node.attrs;

  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef<HTMLDivElement>(null);

  // --- 1. RESIZE LOGIC ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = resizeRef.current?.offsetWidth || 0;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX;
      const diffX = currentX - startX;
      const newWidth = Math.max(200, startWidth + diffX); 

      if (resizeRef.current) {
        resizeRef.current.style.width = `${newWidth}px`;
      }
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      setIsResizing(false);

      if (resizeRef.current) {
        updateAttributes({ width: `${resizeRef.current.offsetWidth}px` });
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const getIcon = () => {
    switch (fileType) {
      case 'video': return <FileVideo className="h-4 w-4 text-foreground" />;
      case 'pdf': return <FileText className="h-4 w-4 text-foreground" />;
      default: return <Paperclip className="h-4 w-4 text-foreground" />;
    }
  };

  // --- 2. IMAGE RENDERING ---
  if (fileType === 'image' && src) {
    return (
      <NodeViewWrapper className="not-prose my-6 w-full flex justify-center relative">
        <div
          ref={resizeRef}
          style={{ width: width || '100%' }}
          className={cn(
            "relative group rounded-lg transition-all",
            isResizing ? "ring-2 ring-blue-500 ring-offset-2" : "",
            // Add a subtle border when hovered so user knows it's interactive
            !selected && !isResizing ? "hover:ring-1 hover:ring-slate-300 dark:hover:ring-zinc-700" : ""
          )}
          // ✅ FIX 1: Add data-drag-handle to the container
          data-drag-handle
          // ✅ FIX 2: Do NOT add draggable="true" here manually. Tiptap handles it.
        >
          <img 
            src={src} 
            alt={fileName} 
            className="w-full h-auto object-contain block rounded-md border border-slate-200 dark:border-zinc-800 shadow-sm cursor-grab active:cursor-grabbing" 
            // ✅ FIX 3: Disable native image drag so the BLOCK drag works
            draggable="false"
          />

          {/* Resize Handle */}
          <div 
            className={cn(
              "absolute bottom-2 right-2 p-1 bg-white/90 dark:bg-black/80 rounded shadow-sm cursor-nwse-resize border border-slate-200 transition-opacity",
              (selected || isResizing) ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}
            onMouseDown={handleMouseDown}
          >
            <MoveDiagonal className="h-4 w-4 text-blue-600" />
          </div>

          {/* Drag Handle Indicator */}
          <div className={cn(
            "absolute top-2 left-1/2 -translate-x-1/2 p-1.5 bg-white/80 dark:bg-black/60 rounded-md backdrop-blur-sm transition-opacity cursor-grab active:cursor-grabbing shadow-sm border border-black/5",
             selected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}>
            <GripHorizontal className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // --- 3. FILE CARD RENDERING ---
  return (
    <NodeViewWrapper className="not-prose w-full">
      <div
        className={cn(
          "flex items-center gap-2 bg-muted rounded-lg p-2 my-2 border border-border cursor-grab active:cursor-grabbing select-none",
          selected ? "ring-2 ring-blue-500 ring-offset-1 bg-muted/80" : ""
        )}
        // ✅ FIX 1: Add handle
        data-drag-handle
      >
        <div className="flex-shrink-0 bg-muted-foreground/20 p-2 rounded-md">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{fileName}</p>
          <p className="text-xs text-muted-foreground capitalize">{fileType || 'file'} Attachment</p>
        </div>
      </div>
    </NodeViewWrapper>
  );
};