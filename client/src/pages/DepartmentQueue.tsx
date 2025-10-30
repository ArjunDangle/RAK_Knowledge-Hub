// client/src/pages/DepartmentQueue.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, FileClock, Loader2, Eye } from "lucide-react";
import { useState } from "react";

import { KnowledgeLayout } from "./KnowledgeLayout";
import { getDepartmentPendingArticles, approveArticle, rejectArticle } from "@/lib/api/api-client";
import { Article } from "@/lib/types/content";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/sonner";
import { formatRelativeTime } from "@/lib/utils/date";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ArticlePage from "./ArticlePage";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function DepartmentQueue() {
    const [reviewingArticle, setReviewingArticle] = useState<Article | null>(null);
    const [rejectionComment, setRejectionComment] = useState("");
    const queryClient = useQueryClient();

    const { data: pendingArticles, isLoading } = useQuery({
        queryKey: ['departmentPendingArticles'],
        queryFn: getDepartmentPendingArticles,
    });

    const approveMutation = useMutation({
        mutationFn: (pageId: string) => approveArticle(pageId),
        onSuccess: (_, pageId) => {
            toast.success("Article approved and published!");
            queryClient.invalidateQueries({ queryKey: ['departmentPendingArticles'] });
            queryClient.invalidateQueries({ queryKey: ['pendingArticles'] }); // Also invalidate global queue for super admins
            if (reviewingArticle?.id === pageId) {
                setReviewingArticle(null);
            }
        },
        onError: (error: Error) => toast.error("Action failed", { description: error.message }),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ pageId, comment }: { pageId: string, comment: string }) => rejectArticle(pageId, { comment }),
        onSuccess: (_, { pageId }) => {
            toast.success("Article rejected and feedback sent.");
            queryClient.invalidateQueries({ queryKey: ['departmentPendingArticles'] });
            queryClient.invalidateQueries({ queryKey: ['pendingArticles'] }); // Also invalidate global queue for super admins
            if (reviewingArticle?.id === pageId) {
                setReviewingArticle(null);
            }
        },
        onError: (error: Error) => toast.error("Action failed", { description: error.message }),
    });

    const isMutating = approveMutation.isPending || rejectMutation.isPending;

    const handleReject = () => {
        if (reviewingArticle && rejectionComment.trim()) {
            rejectMutation.mutate({ pageId: reviewingArticle.id, comment: rejectionComment });
        }
    };
    
    const handleCloseModal = () => {
        setReviewingArticle(null);
        setRejectionComment("");
    };

    const breadcrumbs = [{ label: "Department Review Queue" }];

    return (
        <>
            <KnowledgeLayout breadcrumbs={breadcrumbs}>
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Department Review Queue</h1>
                        <p className="text-muted-foreground">Review and manage content submissions for your assigned departments.</p>
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
                                                <Skeleton className="h-8 w-24 inline-block" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : pendingArticles && pendingArticles.length > 0 ? (
                                    pendingArticles.map(article => (
                                        <TableRow key={article.id}>
                                            <TableCell className="font-medium">{article.title}</TableCell>
                                            <TableCell>{article.author || 'N/A'}</TableCell>
                                            <TableCell>{formatRelativeTime(article.updatedAt)}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => setReviewingArticle(article)}>
                                                    <Eye className="h-4 w-4 mr-2" />Review
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            <FileClock className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                            No articles pending review in your departments.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </KnowledgeLayout>

            <Dialog open={!!reviewingArticle} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
                <DialogContent className="max-w-6xl h-[95vh] flex flex-col p-0">
                    <DialogHeader className="p-6 pb-2">
                        <DialogTitle>Article Preview</DialogTitle>
                        <DialogDescription>Review the article content. You can approve it directly or add comments before rejecting.</DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-1">
                        {reviewingArticle && (
                            <ArticlePage pageId={reviewingArticle.id} isPreviewMode={true} />
                        )}
                    </div>
                    <DialogFooter className="p-6 bg-muted/50 border-t flex-col sm:flex-col md:flex-row items-start md:items-center">
                        <div className="w-full space-y-2">
                           <Label htmlFor="rejection-comment">Rejection Comments (Required to Reject)</Label>
                           <Textarea 
                                id="rejection-comment"
                                placeholder="e.g., Please add more details to the introduction..."
                                value={rejectionComment}
                                onChange={(e) => setRejectionComment(e.target.value)}
                                className="bg-background"
                           />
                        </div>
                        <div className="flex-shrink-0 pt-2 sm:pt-2 md:pt-0 md:pl-4 self-end md:self-center">
                            <Button variant="outline" className="mr-2" onClick={handleCloseModal}>Cancel</Button>
                            <Button
                                variant="destructive"
                                className="mr-2"
                                onClick={handleReject}
                                disabled={!rejectionComment.trim() || isMutating}
                            >
                                {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                                Reject with Comment
                            </Button>
                            <Button
                                onClick={() => approveMutation.mutate(reviewingArticle!.id)}
                                disabled={isMutating}
                            >
                                {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                Approve
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}