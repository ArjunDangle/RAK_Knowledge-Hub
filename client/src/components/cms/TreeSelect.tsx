import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
import { getPageTree, getArticleById, getPageById } from '@/lib/api/api-client';
import { PageTreeNode } from '@/lib/types/content';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TreeNode } from './TreeNode';

interface TreeSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const TreeSelect = ({ value, onChange, placeholder = 'Select a category...' }: TreeSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNodeTitle, setSelectedNodeTitle] = useState<string | null>(null);

  // Fetch initial top-level nodes
  const { data: topLevelNodes, isLoading: isTreeLoading } = useQuery({
    queryKey: ['pageTree', 'root'],
    queryFn: () => getPageTree(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch the full details of the currently selected page to display its title
  useEffect(() => {
    if (value) {
      // This is a simple way to get the title. In a real app, you might have a dedicated endpoint.
      getPageById(value)
        .then(page => setSelectedNodeTitle(page.title))
        .catch(() => {
          getArticleById(value)
            .then(article => article && setSelectedNodeTitle(article.title))
            .catch(() => setSelectedNodeTitle("Unknown Selection"));
        });
    } else {
      setSelectedNodeTitle(null);
    }
  }, [value]);

  const handleSelect = (node: PageTreeNode) => {
    setSelectedNodeTitle(node.title);
    onChange(node.id);
    setIsOpen(false);
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{selectedNodeTitle || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <ScrollArea className="max-h-72 overflow-y-auto overscroll-contain">
          <div className="p-2">
            {isTreeLoading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {topLevelNodes?.map(node => (
              <TreeNode
                key={node.id}
                node={node}
                level={0}
                onSelect={handleSelect}
                selectedId={value}
              />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};