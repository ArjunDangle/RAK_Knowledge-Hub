// client/src/components/cms/TreeNode.tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2 } from 'lucide-react';
import { getPageTreeWithPermissions, PageTreeNodeWithPermission } from '@/lib/api/api-client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner'; // <-- IMPORT TOAST

interface TreeNodeProps {
  node: PageTreeNodeWithPermission; // <-- USE NEW TYPE
  level: number;
  onSelect: (node: PageTreeNodeWithPermission) => void;
  selectedId?: string;
  allowedOnly?: boolean;
}

export const TreeNode = ({ node, level, onSelect, selectedId, allowedOnly = false }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: children, isLoading } = useQuery({
    queryKey: ['pageTreeWithPermissions', node.id, allowedOnly],
    queryFn: () => getPageTreeWithPermissions(node.id, allowedOnly), 
    enabled: isExpanded && node.hasChildren,
    staleTime: 5 * 60 * 1000,
  });

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  // --- MODIFY THIS FUNCTION ---
  const handleSelect = () => {
    if (!node.isAllowed) {
      toast.warning("Permission Denied", {
        description: "You can only create pages under sections managed by your groups.",
      });
      return; // Prevent selection
    }
    onSelect(node);
  };
  // --- END MODIFICATION ---

  return (
    <div>
      <div
        onClick={handleSelect}
        // --- MODIFY THIS className ---
        className={cn(
          "flex items-center w-full rounded-md text-sm transition-colors group",
          selectedId === node.id && "bg-accent text-accent-foreground",
          node.isAllowed
            ? "hover:bg-accent cursor-pointer"
            : "text-muted-foreground/60 cursor-not-allowed hover:bg-transparent"
        )}
        // --- END MODIFICATION ---
      >
        <div style={{ width: `${level * 1.25}rem` }} className="flex-shrink-0 h-8" />
        <div 
          className="flex items-center justify-center w-6 h-8 flex-shrink-0"
          onClick={handleToggleExpand}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            node.hasChildren && (
              <ChevronRight
                className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")}
              />
            )
          )}
        </div>
        <span className="truncate flex-1 py-2 pr-2" title={node.title}>
          {node.title}
        </span>
      </div>

      {isExpanded && children && (
        <div>
          {children.map(childNode => (
            <TreeNode key={childNode.id} node={childNode} level={level + 1} onSelect={onSelect} selectedId={selectedId} allowedOnly={allowedOnly}/>
          ))}
        </div>
      )}
    </div>
  );
};