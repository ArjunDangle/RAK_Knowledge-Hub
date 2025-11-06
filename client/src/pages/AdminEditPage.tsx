// client/src/pages/AdminEditPage.tsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import {
  getPageDetailsForEdit,
  updatePage,
  PageUpdatePayload,
  getAllTags,
} from "@/lib/api/api-client";
import {
  RichTextEditor,
  useConfiguredEditor,
} from "@/components/editor/RichTextEditor";
import { TreeSelect } from "@/components/cms/TreeSelect";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { Skeleton } from "@/components/ui/skeleton";

// Validation schema matching the create page
const editPageSchema = z.object({
  title: z
    .string()
    .min(5, { message: "Title must be at least 5 characters long." }),
  description: z
    .string()
    .min(10, "Description must be at least 10-15 words.")
    .max(150, "Description must be 10-15 words (max 150 chars)."),
  parent_id: z
    .string()
    .min(1, { message: "You must select a parent category." }),
  tags: z.array(z.string()).min(1, { message: "Select at least one tag." }),
});

type EditPageFormData = z.infer<typeof editPageSchema>;

export default function AdminEditPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch the article's full details for editing
  const {
    data: pageDetails,
    isLoading: isLoadingDetails,
    isError,
  } = useQuery({
    queryKey: ["pageEditDetails", pageId],
    queryFn: () => getPageDetailsForEdit(pageId!),
    enabled: !!pageId,
    retry: false,
  });

  // Fetch all tags for the dropdown
  const { data: allTags, isLoading: isLoadingTags } = useQuery({
    queryKey: ["allTags"],
    queryFn: getAllTags,
  });
  const tagOptions: MultiSelectOption[] = allTags
    ? allTags.map((tag) => ({ value: tag.name, label: tag.name }))
    : [];

  const form = useForm<EditPageFormData>({
    resolver: zodResolver(editPageSchema),
    defaultValues: {
      title: "",
      description: "",
      parent_id: "",
      tags: [],
    },
  });

  // Note: Attachments are not editable in this flow to keep it simple.
  // Admins would need to edit in Confluence for complex attachment changes.
  const editor = useConfiguredEditor(pageDetails?.content || "", () => {});

  useEffect(() => {
    if (pageDetails) {
      form.reset({
        title: pageDetails.title,
        description: pageDetails.description,
        parent_id: pageDetails.parent_id || "",
        tags: pageDetails.tags,
      });
      if (
        editor &&
        !editor.isDestroyed &&
        editor.getHTML() !== pageDetails.content
      ) {
        editor.commands.setContent(pageDetails.content);
      }
    }
  }, [pageDetails, form, editor]);

  const mutation = useMutation({
    mutationFn: (data: PageUpdatePayload) => updatePage(pageId!, data),
    onSuccess: () => {
      toast.success("Article updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["pageEditDetails", pageId] });
      queryClient.invalidateQueries({ queryKey: ["pendingArticles"] });
      navigate(`/article/${pageId}?status=preview`);
    },
    onError: (error) => {
      toast.error("Update failed", { description: error.message });
    },
  });

  const onSubmit = (data: EditPageFormData) => {
    const content = editor?.getHTML() || "";
    if (content.length < 50) {
      toast.error("Content is too short", {
        description: "Content must be at least 50 characters.",
      });
      return;
    }

    const payload: PageUpdatePayload = { ...data, content };
    mutation.mutate(payload);
  };

  if (isLoadingDetails) {
    return (
      <KnowledgeLayout
        breadcrumbs={[{ label: "Admin" }, { label: "Edit Article" }]}
      >
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </KnowledgeLayout>
    );
  }

  if (isError || !pageDetails) {
    return (
      <KnowledgeLayout breadcrumbs={[{ label: "Admin" }, { label: "Error" }]}>
        <div className="text-center">Error loading article details.</div>
      </KnowledgeLayout>
    );
  }

  return (
    <KnowledgeLayout
      breadcrumbs={[{ label: "Admin" }, { label: "Edit Article" }]}
    >
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Article: {pageDetails.title}</CardTitle>
            <CardDescription>
              Make changes to the article. Saving will update the content for
              review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Textarea {...field} />
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
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <TreeSelect
                          value={field.value}
                          onChange={field.onChange}
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
                        <MultiSelect
                          options={tagOptions}
                          selected={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Content</FormLabel>
                  <RichTextEditor editor={editor} />
                </div>

                <div className="flex items-center gap-4">
                  <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => navigate("/admin/dashboard")}
                  >
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
