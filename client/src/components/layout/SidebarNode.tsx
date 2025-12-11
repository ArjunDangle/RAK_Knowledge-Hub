// client/src/components/layout/SidebarNode.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLayout } from "@/pages/KnowledgeLayout";
import { getPageContents } from "@/lib/api/api-client";
import { ContentItem } from "@/lib/types/content";
import { Skeleton } from "@/components/ui/skeleton";

interface SidebarNodeProps {
  item: ContentItem;
  level: number;
}

export function SidebarNode({ item, level }: SidebarNodeProps) {
  const { activePath } = useLayout();
  const location = useLocation();
  const isArticle = item.type === 'article';
  const isFolder = item.type === 'subsection';

  const isActive = activePath.includes(item.id);
  const isCurrentPage = location.pathname.includes(item.id);
  const [isExpanded, setIsExpanded] = useState(isActive);

  // This effect ensures parent nodes expand when a child becomes active
  useEffect(() => {
    if (isActive) {
      setIsExpanded(true);
    }
  }, [isActive]);

  // This query now returns a PaginatedResponse object: { items: [], ... }
  const { data: children, isLoading } = useQuery({
    queryKey: ['sidebar-children', item.id],
    queryFn: () => getPageContents(item.id), // This will fetch page 1
    enabled: isExpanded && isFolder,
    staleTime: 5 * 60 * 1000,
  });

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      setIsExpanded(!isExpanded);
    }
  };

  const linkUrl = isFolder ? `/page/${item.id}` : `/article/${item.id}`;

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between rounded-md text-sm transition-colors group",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isCurrentPage && "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
        )}
        style={{ paddingLeft: `${level * 0.5}rem` }}
      >
        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
          {isFolder ? (
            <ChevronRight
              className={cn("h-4 w-4 cursor-pointer transition-transform", isExpanded && "rotate-90")}
              onClick={handleToggle}
            />
          ) : (
            <span className="text-muted-foreground">•</span>
          )}
        </div>

        <Link to={linkUrl} className="flex-1 py-2 whitespace-normal break-words" title={item.title}>
          {item.title}
        </Link>
      </div>

      {isExpanded && isFolder && (
        <div className="pl-4">
          {isLoading && <div className="space-y-2 py-2 pl-4"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-6 w-2/3" /></div>}
          
          {/* --- THIS IS THE FIX --- */}
          {/* We now map over 'children.items' instead of 'children' */}
          {children?.items?.map((child) => <SidebarNode key={child.id} item={child} level={level + 1} />)}
          {/* --- END OF FIX --- */}
        </div>
      )}
    </div>
  );
}