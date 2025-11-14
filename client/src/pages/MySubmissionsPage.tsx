// client/src/pages/MySubmissionsPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { getMySubmissions, ArticleSubmission, ArticleSubmissionStatus } from "@/lib/api/api-client"; // <-- Import types directly
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils/date";
import { FileClock, Check, X, Edit, ExternalLink, MessageSquareWarning } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

const statusConfig: { [key in ArticleSubmissionStatus]: { text: string, icon: React.ElementType, className: string } } = {
    PENDING_REVIEW: { text: "Pending Review", icon: FileClock, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    REJECTED: { text: "Rejected", icon: X, className: "bg-red-100 text-red-800 border-red-200" },
    PUBLISHED: { text: "Published", icon: Check, className: "bg-green-100 text-green-800 border-green-200" },
};

export default function MySubmissionsPage() {
    const [commentToShow, setCommentToShow] = useState<string | null>(null);

    // useQuery now correctly infers the type as ArticleSubmission[]
    const { data: submissions, isLoading } = useQuery<ArticleSubmission[]>({
        queryKey: ['mySubmissions'],
        queryFn: getMySubmissions,
    });

    const breadcrumbs = [{ label: "My Submissions" }];

    // The parameter type is now the clean, central ArticleSubmission type
    const renderActionButtons = (submission: ArticleSubmission) => {
        switch (submission.status) {
            case "REJECTED":
                return (
                    <div className="flex justify-end gap-2">
                        {submission.rejectionComment && (
                            <Button variant="outline" size="sm" onClick={() => setCommentToShow(submission.rejectionComment!)}>
                                <MessageSquareWarning className="h-4 w-4 mr-2" />
                                View Feedback
                            </Button>
                        )}
                        <Button asChild variant="default" size="sm">
                            <Link to={`/edit-submission/${submission.confluencePageId}`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit & Resubmit
                            </Link>
                        </Button>
                    </div>
                );
            case "PUBLISHED":
                return (
                     <Button asChild variant="outline" size="sm">
                        <Link to={`/article/${submission.confluencePageId}`}>
                           <ExternalLink className="h-4 w-4 mr-2" />
                           View Article
                        </Link>
                    </Button>
                );
            case "PENDING_REVIEW":
            default:
                return (
                    <Button variant="outline" size="sm" disabled>
                        Pending Review
                    </Button>
                );
        }
    };

    return (
        <>
            <KnowledgeLayout breadcrumbs={breadcrumbs}>
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">My Submissions</h1>
                        <p className="text-muted-foreground">Track the status of your submitted articles and resubmit work after addressing feedback.</p>
                    </div>

                    <div className="border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="text-right w-[340px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 3 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                            <TableCell className="text-right"><Skeleton className="h-8 w-48 inline-block" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : submissions && submissions.length > 0 ? (
                                    submissions.map((submission) => {
                                        const config = statusConfig[submission.status];
                                        return (
                                            <TableRow key={submission.id}>
                                                <TableCell className="font-medium">{submission.title}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={config.className}>
                                                        <config.icon className="h-3 w-3 mr-1.5" />
                                                        {config.text}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{formatRelativeTime(submission.updatedAt)}</TableCell>
                                                <TableCell className="text-right">
                                                    {renderActionButtons(submission)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            You have not submitted any articles yet.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </KnowledgeLayout>

            <Dialog open={!!commentToShow} onOpenChange={() => setCommentToShow(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Admin Feedback</DialogTitle>
                        <DialogDescription>
                            Please address the following points before resubmitting your article.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="my-4 p-4 bg-muted/50 border rounded-md text-sm whitespace-pre-wrap">
                        {commentToShow}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setCommentToShow(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}