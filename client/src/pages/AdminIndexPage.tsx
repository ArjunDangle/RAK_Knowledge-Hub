// client/src/pages/AdminIndexPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { getContentIndex, ContentNode, ArticleSubmissionStatus, searchContentIndex } from "@/lib/api/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash } from "lucide-react";
import { ContentIndexNode } from "@/components/cms/ContentIndexNode";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";

const TableHeader = () => (
    <div className="flex items-center border-b font-semibold text-sm text-muted-foreground px-2 py-2 bg-muted/50 rounded-t-md">
        <div className="flex-1 min-w-0 pl-2">Page Title</div>
        <div className="flex items-center gap-4 px-4 flex-shrink-0">
            <span className="w-28 text-left">Status</span>
            <span className="w-32 text-left hidden md:block">Author</span>
            <span className="w-32 text-left hidden lg:block">Last Updated</span>
            <span className="w-7"></span>
        </div>
    </div>
);

export default function AdminIndexPage() {
    const breadcrumbs = [{ label: "Admin" }, { label: "Content Index" }];

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<ArticleSubmissionStatus | "ALL">("ALL");

    // Debounce search term to prevent API calls on every keystroke
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    // Query for the hierarchical tree (only runs when search is empty)
    const { data: contentTree, isLoading: isTreeLoading, isError, error } = useQuery<ContentNode[]>({
        queryKey: ['contentIndex', 'root'],
        queryFn: () => getContentIndex(),
        enabled: debouncedSearchTerm.length === 0,
    });
    
    // Query for the flattened search results (only runs when user is searching)
    const { data: searchResults, isLoading: isSearchLoading } = useQuery<ContentNode[]>({
        queryKey: ['contentIndexSearch', debouncedSearchTerm],
        queryFn: () => searchContentIndex(debouncedSearchTerm),
        enabled: debouncedSearchTerm.length > 1,
    });

    const isLoading = isTreeLoading || isSearchLoading;
    const isSearching = debouncedSearchTerm.length > 1;

    // Filter results on the client-side *after* fetching
    const displayData = (isSearching ? searchResults : contentTree)?.filter(node => 
        statusFilter === 'ALL' || node.status === statusFilter
    );

    return (
        <KnowledgeLayout breadcrumbs={breadcrumbs}>
            <div className="max-w-full mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Content Index</h1>
                    <p className="text-muted-foreground">
                        Manage the entire knowledge hub structure. Review statuses, find authors, and perform quick actions.
                    </p>
                </div>
                
                <div className="flex gap-4 mb-4">
                    <Input
                        placeholder="Search by title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-xs"
                    />
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
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

                <div className="border rounded-md">
                    <TableHeader />
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
                                // When searching, we render a flat list. The `ContentIndexNode` still works,
                                // but its expand functionality won't be used since children are not loaded.
                                <ContentIndexNode key={node.id} node={node} level={0} />
                            ))}
                        </div>
                    ) : !isLoading && (
                         <div className="p-8 text-center text-muted-foreground">
                            No content found matching your criteria.
                        </div>
                    )}
                </div>
            </div>
        </KnowledgeLayout>
    );
}