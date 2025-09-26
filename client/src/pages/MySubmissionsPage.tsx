// client/src/pages/MySubmissionsPage.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { getMySubmissions, resubmitArticle } from "@/lib/api/api-client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils/date";
import { FileClock, Check, X, Edit, Send, ExternalLink } from "lucide-react";
import { ArticleSubmission, ArticleSubmissionStatus } from "@/lib/api/api-client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

// IMPORTANT: Replace this with your actual Confluence space URL
const CONFLUENCE_BASE_URL = "https://rakwireless.atlassian.net/wiki";

const statusConfig: { [key in ArticleSubmissionStatus]: { text: string, icon: React.ElementType, className: string } } = {
    PENDING_REVIEW: { text: "Pending Review", icon: FileClock, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    REJECTED: { text: "Rejected", icon: X, className: "bg-red-100 text-red-800 border-red-200" },
    PUBLISHED: { text: "Published", icon: Check, className: "bg-green-100 text-green-800 border-green-200" },
};

export default function MySubmissionsPage() {
    const queryClient = useQueryClient();

    const { data: submissions, isLoading } = useQuery({
        queryKey: ['mySubmissions'],
        queryFn: getMySubmissions,
    });
    
    const resubmitMutation = useMutation({
        mutationFn: resubmitArticle,
        onSuccess: () => {
            toast.success("Article has been resubmitted for review.");
            queryClient.invalidateQueries({ queryKey: ['mySubmissions'] });
        },
        onError: (error) => {
            toast.error("Resubmission failed", { description: error.message });
        }
    });

    const breadcrumbs = [{ label: "My Submissions" }];

    const renderActionButtons = (submission: ArticleSubmission) => {
        switch (submission.status) {
            case "REJECTED":
                return (
                    <div className="flex justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                            <a href={`${CONFLUENCE_BASE_URL}/pages/viewpage.action?pageId=${submission.confluencePageId}`} target="_blank" rel="noopener noreferrer">
                                <Edit className="h-4 w-4 mr-2" />
                                View Feedback & Edit
                            </a>
                        </Button>
                        <Button size="sm" onClick={() => resubmitMutation.mutate(submission.confluencePageId)} disabled={resubmitMutation.isPending}>
                            <Send className="h-4 w-4 mr-2" />
                            Publish Again
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
                                <TableHead className="text-right w-[320px]">Actions</TableHead>
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
                                submissions.map((submission: ArticleSubmission) => {
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
    );
}