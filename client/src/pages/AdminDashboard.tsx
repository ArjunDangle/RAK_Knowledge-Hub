// client/src/pages/AdminDashboard.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, FileClock, Loader2 } from "lucide-react";

import { KnowledgeLayout } from "./KnowledgeLayout";
import { getPendingArticles, approveArticle, rejectArticle } from "@/lib/api/api-client";
import { Article } from "@/lib/types/content";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { formatRelativeTime } from "@/lib/utils/date";

export default function AdminDashboard() {
    const queryClient = useQueryClient();
    const { data: pendingArticles, isLoading } = useQuery({
        queryKey: ['pendingArticles'],
        queryFn: getPendingArticles,
    });

    const createMutation = (mutationFn: (pageId: string) => Promise<void>, successMessage: string) => {
        return useMutation({
            mutationFn,
            onMutate: async (pageId: string) => {
                // Cancel any outgoing refetches so they don't overwrite our optimistic update
                await queryClient.cancelQueries({ queryKey: ['pendingArticles'] });

                // Snapshot the previous value
                const previousArticles = queryClient.getQueryData<Article[]>(['pendingArticles']);

                // Optimistically remove the article from the list
                if (previousArticles) {
                    queryClient.setQueryData<Article[]>(
                        ['pendingArticles'],
                        previousArticles.filter(article => article.id !== pageId)
                    );
                }

                // Return a context object with the snapshotted value
                return { previousArticles };
            },
            // If the mutation fails, use the context returned from onMutate to roll back
            onError: (error: Error, _pageId: string, context: { previousArticles?: Article[] } | undefined) => {
                // Roll back to the previous state on error
                if (context?.previousArticles) {
                    queryClient.setQueryData<Article[]>(['pendingArticles'], context.previousArticles);
                }
                toast.error("Action failed", { description: error.message });
                // Invalidate on error to ensure we sync with the server's state
                queryClient.invalidateQueries({ queryKey: ['pendingArticles'] });
            },
            onSuccess: () => {
                // On success, we trust our optimistic update and just show the notification
                toast.success(successMessage);
            },
        });
    };

    const approveMutation = createMutation(approveArticle, "Article approved and published!");
    const rejectMutation = createMutation(rejectArticle, "Article rejected.");

    const isMutating = approveMutation.isPending || rejectMutation.isPending;

    const breadcrumbs = [{ label: "Admin Dashboard" }];

    return (
        <KnowledgeLayout breadcrumbs={breadcrumbs}>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
                    <p className="text-muted-foreground">Review and manage content submissions.</p>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Author</TableHead>
                                <TableHead>Submitted</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Skeleton className="h-8 w-20 inline-block" />
                                            <Skeleton className="h-8 w-20 inline-block" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : pendingArticles && pendingArticles.length > 0 ? (
                                pendingArticles.map(article => (
                                    <TableRow key={article.id}>
                                        <TableCell className="font-medium">
                                            <Link to={`/article/${article.id}`} target="_blank" className="hover:underline">
                                                {article.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell>{article.author}</TableCell>
                                        <TableCell>{formatRelativeTime(article.updatedAt)}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => rejectMutation.mutate(article.id)}
                                                disabled={isMutating}
                                            >
                                                {rejectMutation.isPending && rejectMutation.variables === article.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => approveMutation.mutate(article.id)}
                                                disabled={isMutating}
                                            >
                                                {approveMutation.isPending && approveMutation.variables === article.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                                Approve
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        <FileClock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                        No articles pending review.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </KnowledgeLayout>
    );
}