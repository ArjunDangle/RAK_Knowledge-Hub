import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Table as TableIcon,
  Grid3X3,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TableSelectorProps {
  editor: Editor;
}

export const TableSelector = ({ editor }: TableSelectorProps) => {
  const [hoverRows, setHoverRows] = useState(0);
  const [hoverCols, setHoverCols] = useState(0);
  const [isCustomDialogOpen, setIsCustomDialogOpen] = useState(false);
  const [customRows, setCustomRows] = useState(3);
  const [customCols, setCustomCols] = useState(3);
  const [isOpen, setIsOpen] = useState(false);

  // Logic: Handles both grid selection and custom dialog insertion
  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
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
          type="button"
          variant={isTableActive ? "secondary" : "ghost"}
          size="sm"
          className="h-8 w-8 p-0"
          onMouseDown={(e) => e.preventDefault()}
          title="Insert Table"
        >
          <TableIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 z-[200]" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className={isTableActive ? "mb-3" : "mb-0"}>
          <div className="text-xs font-medium mb-2 text-muted-foreground text-center">
            {hoverRows > 0 ? `${hoverCols} x ${hoverRows}` : "Select Table Size"}
          </div>
          
          {/* 10x10 Grid Selector Logic */}
          <div 
            className="grid gap-1 mb-3 justify-center" 
            style={{ gridTemplateColumns: "repeat(10, 1fr)" }}
            onMouseLeave={() => { setHoverRows(0); setHoverCols(0); }}
          >
            {Array.from({ length: 100 }).map((_, i) => {
              const row = Math.floor(i / 10) + 1;
              const col = (i % 10) + 1;
              return (
                <button
                  type="button"
                  key={i}
                  className={`w-4 h-4 border rounded-sm transition-colors ${
                    row <= hoverRows && col <= hoverCols 
                      ? "bg-primary border-primary" 
                      : "bg-muted border-muted-foreground/20"
                  }`}
                  onMouseEnter={() => { setHoverRows(row); setHoverCols(col); }}
                  onClick={() => insertTable(row, col)}
                  onMouseDown={(e) => e.preventDefault()}
                />
              );
            })}
          </div>

          <Dialog open={isCustomDialogOpen} onOpenChange={setIsCustomDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8" onMouseDown={(e) => e.preventDefault()}>
                <Grid3X3 className="mr-2 h-3 w-3" /> Custom Table...
              </Button>
            </DialogTrigger>
            <DialogContent className="z-[120]">
              <DialogHeader><DialogTitle>Insert Custom Table</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label>Columns</Label>
                  <Input type="number" min={1} max={20} value={customCols} onChange={(e) => setCustomCols(parseInt(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Rows</Label>
                  <Input type="number" min={1} max={50} value={customRows} onChange={(e) => setCustomRows(parseInt(e.target.value))} />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => insertTable(customRows, customCols)}>Insert Table</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Table Management Actions: Only shows when the cursor is inside a table */}
        {isTableActive && (
          <div className="space-y-1 border-t mt-2 pt-2">
            <div className="grid grid-cols-2 gap-1">
              <Button type="button" variant="ghost" size="sm" className="justify-start h-7 px-2 text-xs" onClick={() => editor.chain().focus().addRowBefore().run()} onMouseDown={(e) => e.preventDefault()}><ArrowUp className="mr-2 h-3 w-3" /> Row Above</Button>
              <Button type="button" variant="ghost" size="sm" className="justify-start h-7 px-2 text-xs" onClick={() => editor.chain().focus().addRowAfter().run()} onMouseDown={(e) => e.preventDefault()}><ArrowDown className="mr-2 h-3 w-3" /> Row Below</Button>
              <Button type="button" variant="ghost" size="sm" className="justify-start h-7 px-2 text-xs" onClick={() => editor.chain().focus().addColumnBefore().run()} onMouseDown={(e) => e.preventDefault()}><ArrowLeft className="mr-2 h-3 w-3" /> Col Left</Button>
              <Button type="button" variant="ghost" size="sm" className="justify-start h-7 px-2 text-xs" onClick={() => editor.chain().focus().addColumnAfter().run()} onMouseDown={(e) => e.preventDefault()}><ArrowRight className="mr-2 h-3 w-3" /> Col Right</Button>
            </div>
            <Button type="button" variant="ghost" size="sm" className="justify-start w-full h-7 mt-1 px-2 text-xs text-destructive hover:bg-destructive/10" onClick={() => editor.chain().focus().deleteTable().run()} onMouseDown={(e) => e.preventDefault()}><Trash2 className="mr-2 h-3 w-3" /> Delete Table</Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};