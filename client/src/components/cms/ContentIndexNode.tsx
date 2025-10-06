// client/src/components/cms/ContentIndexNode.tsx
import { useState } from 'react';
import { ChevronRight, Edit, ExternalLink, Send, Check, X, MoreVertical } from 'lucide-react';
import { ContentNode } from '@/lib/api/api-client';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/utils/date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { approveArticle, rejectArticle } from '@/lib/api/api-client';
import { toast } from 'sonner';

interface ContentIndexNodeProps {
  node: ContentNode;
  level: number;
}

const statusConfig = {
    PENDING_REVIEW: { text: "Pending", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    REJECTED: { text: "Rejected", className: "bg-red-100 text-red-800 border-red-200" },
    PUBLISHED: { text: "Published", className: "bg-green-100 text-green-800 border-green-200" },
};

export const ContentIndexNode = ({ node, level }: ContentIndexNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(level < 1); // Auto-expand first level
  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: approveArticle,
    onSuccess: () => {
        toast.success(`'${node.title}' has been approved.`);
        queryClient.invalidateQueries({ queryKey: ['contentIndex'] });
    },
    onError: (error) => toast.error("Approval failed", { description: error.message }),
  });

  // For now, reject without comment for simplicity on this page.
  const rejectMutation = useMutation({
    mutationFn: (pageId: string) => rejectArticle(pageId, { comment: 'Rejected from content index page.' }),
    onSuccess: () => {
        toast.info(`'${node.title}' has been rejected.`);
        queryClient.invalidateQueries({ queryKey: ['contentIndex'] });
    },
    onError: (error) => toast.error("Rejection failed", { description: error.message }),
  });

  const hasChildren = node.children && node.children.length > 0;
  const status = statusConfig[node.status] || { text: 'Unknown', className: 'bg-gray-200' };

  return (
    <div className="flex flex-col">
        <div className="flex items-center hover:bg-muted/50 rounded-md py-1">
            <div style={{ paddingLeft: `${level * 1.5}rem` }} className="flex items-center flex-1 min-w-0">
                {hasChildren ? (
                    <ChevronRight
                        className={cn("h-4 w-4 mr-2 cursor-pointer transition-transform", isExpanded && "rotate-90")}
                        onClick={() => setIsExpanded(!isExpanded)}
                    />
                ) : (
                    <span className="w-6 mr-2" />
                )}
                <span className="truncate font-medium flex-1 pr-4">{node.title}</span>
            </div>

            <div className="flex items-center gap-4 px-4 flex-shrink-0">
                <Badge variant="outline" className={cn("w-28 justify-center", status.className)}>{status.text}</Badge>
                <span className="w-32 text-sm text-muted-foreground truncate hidden md:block">{node.author}</span>
                <span className="w-32 text-sm text-muted-foreground hidden lg:block">{formatRelativeTime(node.updatedAt)}</span>
                
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
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
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        {isExpanded && hasChildren && (
            <div>
                {node.children.map(childNode => (
                    <ContentIndexNode key={childNode.id} node={childNode} level={level + 1} />
                ))}
            </div>
        )}
    </div>
  );
};