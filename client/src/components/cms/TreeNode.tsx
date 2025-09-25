import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Loader2 } from 'lucide-react';
import { getPageTree } from '@/lib/api/api-client';
import { PageTreeNode } from '@/lib/types/content';
import { cn } from '@/lib/utils';

interface TreeNodeProps {
  node: PageTreeNode;
  level: number;
  onSelect: (node: PageTreeNode) => void;
  selectedId?: string;
}

export const TreeNode = ({ node, level, onSelect, selectedId }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: children, isLoading } = useQuery({
    queryKey: ['pageTree', node.id],
    queryFn: () => getPageTree(node.id),
    enabled: isExpanded && node.hasChildren,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the select action from firing when expanding
    if (node.hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onSelect(node);
  };

  return (
    <div>
      <div
        onClick={handleSelect}
        className={cn(
          "flex items-center w-full rounded-md text-sm transition-colors group hover:bg-accent cursor-pointer",
          selectedId === node.id && "bg-accent text-accent-foreground"
        )}
      >
        {/* Indentation Spacer */}
        <div style={{ width: `${level * 1.25}rem` }} className="flex-shrink-0 h-8" />

        {/* Icon Container */}
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
        
        {/* Title */}
        <span className="truncate flex-1 py-2 pr-2" title={node.title}>
          {node.title}
        </span>
      </div>

      {isExpanded && children && (
        <div>
          {children.map(childNode => (
            <TreeNode key={childNode.id} node={childNode} level={level + 1} onSelect={onSelect} selectedId={selectedId} />
          ))}
        </div>
      )}
    </div>
  );
};