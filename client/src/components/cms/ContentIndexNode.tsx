// client/src/components/cms/ContentIndexNode.tsx
import { useState, useMemo } from 'react';
import { ChevronRight, Edit, ExternalLink, Send, Check, X, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { ContentNode, approveArticle, rejectArticle, deletePage, getContentIndex } from '@/lib/api/api-client';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '../ui/skeleton';
import { Checkbox } from "@/components/ui/checkbox";

interface ContentIndexNodeProps {
  node: ContentNode;
  level: number;
  onToggleSelection: (ids: string[], action: 'add' | 'remove') => void;
  selectedIds: Set<string>;
  isManageMode: boolean;
}

interface ApiError {
  detail?: string;
}

const statusConfig = {
    PENDING_REVIEW: { text: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    REJECTED: { text: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
    PUBLISHED: { text: "Published", className: "bg-green-100 text-green-800 border-green-200" },
};

// Helper function to recursively get all descendant IDs from loaded nodes
const getAllDescendantIds = (nodes: ContentNode[] | undefined): string[] => {
    if (!nodes) return [];
    let ids: string[] = [];
    for (const n of nodes) {
        ids.push(n.id);
        if (n.children && n.children.length > 0) {
            ids = [...ids, ...getAllDescendantIds(n.children)];
        }
    }
    return ids;
};

export const ContentIndexNode = ({ node, level, onToggleSelection, selectedIds, isManageMode }: ContentIndexNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(level < 1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: children, isLoading: childrenLoading } = useQuery({
    queryKey: ['contentIndex', node.id],
    queryFn: () => getContentIndex(node.id),
    enabled: isExpanded && node.hasChildren,
    staleTime: 5 * 60 * 1000,
  });

  const approveMutation = useMutation({
    mutationFn: approveArticle,
    onSuccess: () => {
        toast.success(`'${node.title}' has been approved.`);
        queryClient.invalidateQueries({ queryKey: ['contentIndex'] });
    },
    onError: (error) => toast.error("Approval failed", { description: error.message }),
  });

  const rejectMutation = useMutation({
    mutationFn: (pageId: string) => rejectArticle(pageId, { comment: 'Rejected from content index page.' }),
    onSuccess: () => {
        toast.info(`'${node.title}' has been rejected.`);
        queryClient.invalidateQueries({ queryKey: ['contentIndex'] });
    },
    onError: (error) => toast.error("Rejection failed", { description: error.message }),
  });
  
  const deleteMutation = useMutation({
    mutationFn: (pageId: string) => deletePage(pageId),
    onSuccess: (_, pageId) => {
        toast.success(`'${node.title}' has been deleted.`);
        queryClient.invalidateQueries({ queryKey: ['contentIndex', 'root'] });
        queryClient.invalidateQueries({ queryKey: ['contentIndexSearch'] });
    },
    onError: (error: ApiError) => {
      const description = error.detail || "Deletion failed. Please try again.";
      toast.error(`'${node.title}' could not be deleted.`, { description });
    },
  });

  const descendantIds = useMemo(() => getAllDescendantIds(children), [children]);

  const checkboxState = useMemo(() => {
    // For leaf nodes (no children), state is simple: checked or not.
    if (!node.hasChildren) {
      return selectedIds.has(node.id);
    }
    // For parent nodes, the state depends on its children.
    // If children are not loaded yet, we can't be certain.
    // We can check if any descendant we know of is selected.
    if (!children) {
        const isSelfSelected = selectedIds.has(node.id);
        // A simple check: if the parent is selected but we don't know about children, it's indeterminate.
        // If not selected, it's false. This is a best-effort for collapsed nodes.
        return isSelfSelected ? 'indeterminate' : false;
    }
    
    // Children are loaded, so we can be accurate.
    const childIds = children.map(c => c.id);
    const selectedChildrenCount = childIds.filter(id => selectedIds.has(id)).length;

    if (selectedChildrenCount === 0) {
        // If no children are selected, the parent is only checked if it was selected independently.
        return selectedIds.has(node.id) ? 'indeterminate' : false;
    }
    if (selectedChildrenCount === childIds.length) {
        // If ALL children are selected, the parent should appear fully checked.
        return true;
    }
    // If SOME children are selected, the parent is indeterminate.
    return 'indeterminate';
  }, [selectedIds, node.id, node.hasChildren, children]);

  const handleCheckboxClick = () => {
    const allRelatedIds = [node.id, ...descendantIds];
    // If it's currently checked, the action is to remove. Otherwise, add.
    const action = checkboxState === true ? 'remove' : 'add';
    onToggleSelection(allRelatedIds, action);
  };
  
  const status = statusConfig[node.status] || { text: 'Unknown', className: 'bg-gray-200' };

  return (
    <>
        <div className={cn("flex items-center hover:bg-muted/50 rounded-md py-1 group", checkboxState !== false && isManageMode && "bg-accent/60")}>
            <div style={{ paddingLeft: `${level * 1.5}rem` }} className="flex items-center flex-1 min-w-0 pl-4">
                {isManageMode && (
                    <Checkbox
                        checked={checkboxState}
                        onCheckedChange={handleCheckboxClick}
                        aria-label={`Select row ${node.title}`}
                        className="mr-4"
                    />
                )}
                {childrenLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : node.hasChildren ? (
                    <ChevronRight
                        className={cn("h-4 w-4 mr-2 cursor-pointer transition-transform", isExpanded && "rotate-90")}
                        onClick={() => setIsExpanded(!isExpanded)}
                    />
                ) : (
                    <span className="inline-block w-4 mr-2" />
                )}
                <span className="truncate font-medium flex-1 pr-4">{node.title}</span>
            </div>

            <div className="flex items-center gap-4 px-4 flex-shrink-0">
                <Badge variant="outline" className={cn("w-28 justify-center", status.className)}>{status.text}</Badge>
                <span className="w-32 text-sm text-muted-foreground truncate hidden md:block">{node.author}</span>
                <span className="w-32 text-sm text-muted-foreground hidden lg:block">{formatRelativeTime(node.updatedAt)}</span>
                
                <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <a href={node.confluenceUrl} target="_blank" rel="noopener noreferrer">
                                <Edit className="mr-2 h-4 w-4" /> Edit in Confluence
                            </a>
                        </DropdownMenuItem>
                        {node.status === 'PUBLISHED' && (
                             <DropdownMenuItem asChild>
                                <a href={`/article/${node.id}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" /> View on Site
                                </a>
                            </DropdownMenuItem>
                        )}
                        {node.status === 'PENDING_REVIEW' && (
                            <>
                                <DropdownMenuItem onClick={() => approveMutation.mutate(node.id)}>
                                    <Check className="mr-2 h-4 w-4 text-green-600" /> Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => rejectMutation.mutate(node.id)}>
                                    <X className="mr-2 h-4 w-4 text-red-600" /> Reject
                                </DropdownMenuItem>
                            </>
                        )}
                        {node.status === 'REJECTED' && (
                             <DropdownMenuItem disabled>
                                <Send className="mr-2 h-4 w-4" /> Awaiting Resubmission
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onSelect={(e) => {
                                e.preventDefault();
                                setIsDeleteDialogOpen(true);
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Page
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        {isExpanded && (
            <div>
                {childrenLoading && <div className="pl-8 py-2"><Skeleton className="h-6 w-3/4" /></div>}
                {children?.map(childNode => (
                    <ContentIndexNode
                        key={childNode.id}
                        node={childNode}
                        level={level + 1}
                        onToggleSelection={onToggleSelection}
                        selectedIds={selectedIds}
                        isManageMode={isManageMode}
                    />
                ))}
            </div>
        )}

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
             <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will attempt to delete the page "{node.title}". This will fail if the page has children. This is a destructive action.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={() => deleteMutation.mutate(node.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        disabled={deleteMutation.isPending}
                    >
                        {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, delete page
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  );
};