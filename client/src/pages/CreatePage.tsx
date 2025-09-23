// client/src/pages/CreatePage.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { createPage, getAllSubsections, PageCreatePayload } from "@/lib/api/api-client";
import { Skeleton } from "@/components/ui/skeleton";

const createPageSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }),
  content: z.string().min(50, { message: "Content must be at least 50 characters long." }),
  parent_id: z.string({ required_error: "Please select a parent category." }),
  tags: z.string().optional(),
});

type CreatePageFormData = z.infer<typeof createPageSchema>;

export default function CreatePage() {
    const navigate = useNavigate();
    const form = useForm<CreatePageFormData>({
        resolver: zodResolver(createPageSchema),
        defaultValues: { title: "", content: "", tags: "" },
    });

    const { data: subsections, isLoading: subsectionsLoading } = useQuery({
        queryKey: ['allSubsections'],
        queryFn: getAllSubsections,
    });

    const mutation = useMutation({
        mutationFn: createPage,
        onSuccess: (data) => {
            toast.success("Article submitted for review!");
            navigate("/");
        },
        onError: (error) => {
            toast.error("Submission failed", { description: error.message });
        },
    });

    const onSubmit = (data: CreatePageFormData) => {
        const payload: PageCreatePayload = {
            ...data,
            tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        };
        mutation.mutate(payload);
    };

    return (
        <KnowledgeLayout breadcrumbs={[{ label: "Create New Content" }]}>
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Submit a New Article</CardTitle>
                        <CardDescription>
                            Fill out the form below to create a new article. It will be sent to an administrator for review before being published.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter the article title..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="parent_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Parent Category</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    {subsectionsLoading ? (
                                                        <Skeleton className="h-10 w-full" />
                                                    ) : (
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select a category or subsection..." />
                                                        </SelectTrigger>
                                                    )}
                                                </FormControl>
                                                <SelectContent>
                                                    {subsections?.map(sub => (
                                                        <SelectItem key={sub.id} value={sub.id}>
                                                            {sub.title} ({sub.group})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="content"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Content</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Write your article content here. You can use HTML tags."
                                                    className="min-h-[300px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="tags"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tags</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., getting-started, configuration, api" {...field} />
                                            </FormControl>
                                            <p className="text-xs text-muted-foreground">Enter comma-separated tags.</p>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" disabled={mutation.isPending}>
                                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit for Review
                                </Button>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </KnowledgeLayout>
    );
}