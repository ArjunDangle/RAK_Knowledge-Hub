// client/src/pages/AdminIndexPage.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeLayout } from "./KnowledgeLayout";
import {
  getContentIndex, ContentNode, ArticleSubmissionStatus, searchContentIndex
} from "@/lib/api/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash, Trash2, Loader2, ListPlus } from "lucide-react";
import { ContentIndexNode } from "@/components/cms/ContentIndexNode";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FailedItem {
    id: string;
    reason: string;
}

interface BulkDeleteResult {
    deleted: string[];
    failed: FailedItem[];
}

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

async function bulkDeletePages(page_ids: string[]): Promise<BulkDeleteResult> {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/cms/admin/pages/bulk-delete`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ page_ids })
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Bulk delete failed');
    }
    return response.json();
}

export default function AdminIndexPage() {
    const breadcrumbs = [{ label: "Admin" }, { label: "Content Index" }];
    const queryClient = useQueryClient();

    const [isManageMode, setIsManageMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<ArticleSubmissionStatus | "ALL">("ALL");
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const { data: contentTree, isLoading: isTreeLoading, isError, error } = useQuery<ContentNode[]>({
        queryKey: ['contentIndex', 'root'],
        queryFn: () => getContentIndex(),
        enabled: debouncedSearchTerm.length === 0,
    });
    
    const { data: searchResults, isLoading: isSearchLoading } = useQuery<ContentNode[]>({
        queryKey: ['contentIndexSearch', debouncedSearchTerm],
        queryFn: () => searchContentIndex(debouncedSearchTerm),
        enabled: debouncedSearchTerm.length > 1,
    });

    const isLoading = isTreeLoading || isSearchLoading;
    const isSearching = debouncedSearchTerm.length > 1;

    const displayData = useMemo(() => {
        const data = isSearching ? searchResults : contentTree;
        return data?.filter(node => 
            statusFilter === 'ALL' || node.status === statusFilter
        ) || [];
    }, [isSearching, searchResults, contentTree, statusFilter]);

    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeletePages,
        onSuccess: (data) => {
            const { deleted, failed } = data;
            if (failed.length === 0) {
                toast.success(`Successfully deleted ${deleted.length} page(s).`);
            } else {
                const failedReasons = failed.map((f: FailedItem) => `• ${f.id}: ${f.reason}`).join('\n');
                toast.warning(`Deleted ${deleted.length} page(s), but ${failed.length} failed.`, {
                    description: <pre className="whitespace-pre-wrap mt-2">{failedReasons}</pre>,
                    duration: 10000,
                });
            }
            setSelectedIds(new Set());
            setIsManageMode(false);
            queryClient.invalidateQueries({ queryKey: ['contentIndex'] });
            queryClient.invalidateQueries({ queryKey: ['contentIndexSearch'] });
        },
        onError: (error: Error) => {
            toast.error("Bulk delete failed", { description: error.message });
        },
        onSettled: () => {
            setIsConfirmOpen(false);
        }
    });

    const handleToggleSelection = (ids: string[], action: 'add' | 'remove') => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (action === 'add') {
                ids.forEach(id => newSet.add(id));
            } else {
                ids.forEach(id => newSet.delete(id));
            }
            return newSet;
        });
    };

    const handleSelectAll = (checked: boolean | 'indeterminate') => {
        const allIds = getAllDescendantIds(displayData).concat(displayData.map(d => d.id));
        if (checked === true) {
            handleToggleSelection(allIds, 'add');
        } else {
            handleToggleSelection(allIds, 'remove');
        }
    };

    const handleCancelManageMode = () => {
        setIsManageMode(false);
        setSelectedIds(new Set());
    };
    
    const headerCheckboxState = useMemo(() => {
        if (displayData.length === 0) return false;
        const allPossibleIds = new Set(getAllDescendantIds(displayData).concat(displayData.map(d => d.id)));
        const selectedCount = Array.from(allPossibleIds).filter(id => selectedIds.has(id)).length;
        
        if (selectedCount === 0) return false;
        if (selectedCount === allPossibleIds.size) return true;
        return 'indeterminate';

    }, [selectedIds, displayData]);

    return (
        <KnowledgeLayout breadcrumbs={breadcrumbs}>
            <div className="max-w-full mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Content Index</h1>
                    <p className="text-muted-foreground">
                        Manage the entire knowledge hub structure. Review statuses, find authors, and perform quick actions.
                    </p>
                </div>
                
                <div className="flex justify-between items-center gap-4 mb-4">
                    <div className="flex gap-4">
                        <Input
                            placeholder="Search by title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-xs"
                        />
                        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ArticleSubmissionStatus | "ALL")}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                <SelectItem value="PUBLISHED">Published</SelectItem>
                                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2">
                        {isManageMode ? (
                            <>
                                {selectedIds.size > 0 && (
                                    <Button variant="destructive" onClick={() => setIsConfirmOpen(true)} disabled={bulkDeleteMutation.isPending}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete ({selectedIds.size})
                                    </Button>
                                )}
                                <Button variant="ghost" onClick={handleCancelManageMode}>Cancel</Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => setIsManageMode(true)}>
                                <ListPlus className="mr-2 h-4 w-4" />
                                Manage
                            </Button>
                        )}
                    </div>
                </div>

                <div className="border rounded-md">
                    <div className="flex items-center border-b font-semibold text-sm text-muted-foreground pl-4 pr-2 py-2 bg-muted/50 rounded-t-md">
                        {isManageMode && (
                            <Checkbox
                                checked={headerCheckboxState}
                                onCheckedChange={handleSelectAll}
                                aria-label="Select all rows"
                                className="mr-4"
                                disabled={displayData.length === 0}
                            />
                        )}
                        <div className="flex-1 min-w-0">Page Title</div>
                        <div className="flex items-center gap-4 px-4 flex-shrink-0">
                            <span className="w-28 text-left">Status</span>
                            <span className="w-32 text-left hidden md:block">Author</span>
                            <span className="w-32 text-left hidden lg:block">Last Updated</span>
                            <span className="w-7"></span>
                        </div>
                    </div>
                    {isLoading && (
                        <div className="p-4 space-y-2">
                            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                        </div>
                    )}
                    {isError && !isSearching && (
                        <div className="p-4">
                            <Alert variant="destructive">
                                <ServerCrash className="h-4 w-4" />
                                <AlertTitle>Failed to load content index</AlertTitle>
                                <AlertDescription>{error?.message}</AlertDescription>
                            </Alert>
                        </div>
                    )}
                    {displayData && displayData.length > 0 ? (
                        <div className="p-2">
                            {displayData.map(node => (
                                <ContentIndexNode 
                                    key={node.id} 
                                    node={node} 
                                    level={0}
                                    onToggleSelection={handleToggleSelection}
                                    selectedIds={selectedIds}
                                    isManageMode={isManageMode}
                                />
                            ))}
                        </div>
                    ) : !isLoading && (
                         <div className="p-8 text-center text-muted-foreground">
                            No content found matching your criteria.
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will attempt to delete {selectedIds.size} selected page(s). Pages that have children cannot be deleted. This action is destructive and cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={bulkDeleteMutation.isPending}
                        >
                            {bulkDeleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Yes, delete selected
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </KnowledgeLayout>
    );
}