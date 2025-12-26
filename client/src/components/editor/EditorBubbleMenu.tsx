import React from "react";
import { Editor } from "@tiptap/react";
import { BubbleMenu } from '@tiptap/react/menus'
// If the error persists with the line above, use: import { BubbleMenu } from '@tiptap/react/menus';
import { 
  GripVertical, 
  Plus, 
  Columns, 
  Rows, 
  Trash 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface EditorBubbleMenuProps {
  editor: Editor;
}

export const EditorBubbleMenu = ({ editor }: EditorBubbleMenuProps) => {
  if (!editor) return null;

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor }) => editor.isActive('table')}
      tippyOptions={{
        duration: 100,
        placement: 'bottom-end',
        offset: [0, 10],
        zIndex: 110, // Preserving your custom Z-index [cite: 19804]
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
            onMouseDown={(e) => e.preventDefault()} // Logic: prevents focus loss [cite: 19805, 19806]
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          side="top" 
          align="end" 
          className="w-auto flex items-center gap-1 p-1 bg-background border border-border shadow-lg rounded-md z-[115]"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex items-center gap-1 mr-2 border-r border-border pr-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs hover:bg-blue-50 hover:text-blue-600"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                // Logic: scrollIntoView: false prevents the page jumping [cite: 19808]
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
              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
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