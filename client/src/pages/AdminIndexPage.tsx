// client/src/pages/AdminIndexPage.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { getContentIndex, ContentNode, ArticleSubmissionStatus } from "@/lib/api/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ServerCrash } from "lucide-react";
import { ContentIndexNode } from "@/components/cms/ContentIndexNode";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

    // --- FIX: ONLY FETCH THE ROOT NODES INITIALLY ---
    const { data: contentTree, isLoading, isError, error } = useQuery<ContentNode[]>({
        queryKey: ['contentIndex', 'root'],
        queryFn: () => getContentIndex(), // Fetch without a parentId to get the top level
    });

    // This filter now only applies to the nodes currently loaded in the UI
    const filteredTree = useMemo(() => {
        if (!contentTree) return [];

        const filterNodes = (nodes: ContentNode[]): ContentNode[] => {
            return nodes.map(node => {
                const filteredChildren = node.children ? filterNodes(node.children) : [];
                const titleMatch = node.title.toLowerCase().includes(searchTerm.toLowerCase());
                const statusMatch = statusFilter === "ALL" || node.status === statusFilter;
                if ((titleMatch && statusMatch) || filteredChildren.length > 0) {
                    return { ...node, children: filteredChildren };
                }
                return null;
            }).filter((node): node is ContentNode => node !== null);
        };
        // Note: For a pure lazy-loaded approach, filtering would be done on the server.
        // This client-side approach will only filter the nodes that have been expanded.
        return filterNodes(contentTree);
    }, [contentTree, searchTerm, statusFilter]);


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
                    {isError && (
                        <div className="p-4">
                            <Alert variant="destructive">
                                <ServerCrash className="h-4 w-4" />
                                <AlertTitle>Failed to load content index</AlertTitle>
                                <AlertDescription>{error.message}</AlertDescription>
                            </Alert>
                        </div>
                    )}
                    {filteredTree && (
                        <div className="p-2">
                            {filteredTree.map(rootNode => (
                                <ContentIndexNode key={rootNode.id} node={rootNode} level={0} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </KnowledgeLayout>
    );
}