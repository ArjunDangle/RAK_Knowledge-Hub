// client/src/components/cms/TreeSelect.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown, Loader2 } from 'lucide-react';
// --- MODIFY IMPORTS ---
import { getPageTreeWithPermissions, getArticleById, getPageById, PageTreeNodeWithPermission } from '@/lib/api/api-client';
// --- END MODIFICATION ---
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TreeNode } from './TreeNode';

interface TreeSelectProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  allowedOnly?: boolean;
}

export const TreeSelect = ({ value, onChange, placeholder = 'Select a category...', allowedOnly = false }: TreeSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNodeTitle, setSelectedNodeTitle] = useState<string | null>(null);

  // --- MODIFY THIS QUERY ---
  const { data: topLevelNodes, isLoading: isTreeLoading } = useQuery({
    queryKey: ['pageTreeWithPermissions', 'root', allowedOnly], // Add to query key
    queryFn: () => getPageTreeWithPermissions(undefined, allowedOnly), // Pass to API function
    staleTime: 5 * 60 * 1000,
  });
  // --- END MODIFICATION ---

  useEffect(() => {
    if (value) {
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

  // --- MODIFY THIS FUNCTION SIGNATURE ---
  const handleSelect = (node: PageTreeNodeWithPermission) => {
  // --- END MODIFICATION ---
    // The internal logic of handleSelect in TreeNode already prevents this from
    // being called for disallowed nodes, but we can keep the check for safety.
    if (!node.isAllowed) return; 

    setSelectedNodeTitle(node.title);
    onChange(node.id);
    setIsOpen(false);
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen} modal={true}>
      <PopoverTrigger asChild>
        {/* --- THIS IS THE FIX --- */}
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedNodeTitle || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        {/* --- END OF FIX --- */}
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
                allowedOnly={allowedOnly}
              />
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};