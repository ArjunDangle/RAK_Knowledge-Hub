// client/src/pages/EditPage.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { getArticleById, updatePage, PageUpdatePayload } from "@/lib/api/api-client";
import { RichTextEditor, useConfiguredEditor } from "@/components/editor/RichTextEditor";
import { ArticleCardSkeleton } from "@/components/ui/loading-skeleton";

// Validation schema for the edit form
const editPageSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }),
  description: z.string().min(10, "Description must be at least 10 characters.").max(150, "Description must be 10-15 words (max 150 chars)."),
  content: z.string().min(50, { message: "Content must be at least 50 characters." }),
});

type EditPageFormData = z.infer<typeof editPageSchema>;

export default function EditPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  // 1. Fetch the article's existing data
  const { data: article, isLoading: isLoadingArticle, isError } = useQuery({
    queryKey: ['article', pageId],
    queryFn: () => getArticleById(pageId!),
    enabled: !!pageId,
    retry: false,
  });

  // 2. Setup the form
  const form = useForm<EditPageFormData>({
    resolver: zodResolver(editPageSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
    },
  });

  // 3. Setup the Tiptap editor
  const editor = useConfiguredEditor(
    article?.html || "",
    () => {},
    (editor) => {
      form.setValue("content", editor.getHTML(), { shouldDirty: true });
    }
  );

  // 4. Populate the form once data is loaded
  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        description: article.description || article.excerpt,
        content: article.html,
      });
      // Also reset the editor content if it's different
      if (editor && !editor.isDestroyed && editor.getHTML() !== article.html) {
        editor.commands.setContent(article.html);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [article]);

  // 5. Setup the mutation for saving changes
  const mutation = useMutation({
    mutationFn: (data: PageUpdatePayload) => updatePage(pageId!, data),
    onSuccess: () => {
      toast.success("Article updated successfully!");
      navigate(`/article/${pageId}`);
    },
    onError: (error) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  // 6. Handle form submission
  const onSubmit = (data: EditPageFormData) => {
    const payload: PageUpdatePayload = {
      title: data.title,
      description: data.description,
      content: data.content,
      tags: article?.tags.map(tag => tag.name),
      parent_id: article?.parentId || undefined,
    };
    mutation.mutate(payload);
  };

  if (isLoadingArticle) {
    return (
      <KnowledgeLayout breadcrumbs={[{ label: "Edit" }, { label: "Loading..." }]}>
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Loading Editor...</CardTitle>
            </CardHeader>
            <CardContent>
              <ArticleCardSkeleton />
            </CardContent>
          </Card>
        </div>
      </KnowledgeLayout>
    );
  }

  if (isError || !article) {
    return (
      <KnowledgeLayout breadcrumbs={[{ label: "Edit" }, { label: "Error" }]}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold">Article Not Found</h1>
          <p className="text-muted-foreground">Could not load the article for editing.</p>
        </div>
      </KnowledgeLayout>
    );
  }

  return (
    <KnowledgeLayout breadcrumbs={[{ label: "Edit" }, { label: article.title }]}>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Article</CardTitle>
            <CardDescription>
              Make changes to the article and save. This will update the content for all users.
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
                        <Input placeholder="Article title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A brief, 10-15 word description for the article card."
                          maxLength={150}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={() => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormControl>
                        <RichTextEditor editor={editor} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button variant="outline" type="button" onClick={() => navigate(-1)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </KnowledgeLayout>
  );
}