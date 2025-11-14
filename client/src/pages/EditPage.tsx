// client/src/pages/EditPage.tsx
import { useEffect, useMemo } from "react"; // MODIFIED: Added useMemo
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
import { getArticleById, updatePage, PageUpdatePayload, getAllTagsGrouped } from "@/lib/api/api-client"; // MODIFIED: Added getAllTagsGrouped
import { GroupedTag } from "@/lib/types/content"; // MODIFIED: Added GroupedTag
import { RichTextEditor, useConfiguredEditor } from "@/components/editor/RichTextEditor";
import { ArticleCardSkeleton } from "@/components/ui/loading-skeleton";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select"; // MODIFIED: Added MultiSelect
import { Skeleton } from "@/components/ui/skeleton"; // MODIFIED: Added Skeleton

// MODIFIED: Base validation schema
const baseSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }),
  description: z.string().min(10, "Description must be at least 10 characters.").max(150, "Description must be 10-15 words (max 150 chars)."),
  content: z.string().min(50, { message: "Content must be at least 50 characters." }),
});

export default function EditPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();

  // Fetch the article's existing data
  const { data: article, isLoading: isLoadingArticle, isError } = useQuery({
    queryKey: ['article', pageId],
    queryFn: () => getArticleById(pageId!),
    enabled: !!pageId,
    retry: false,
  });

  // MODIFIED: Fetch all tag groups for the multi-select options
  const { data: tagGroups, isLoading: isLoadingTags } = useQuery<GroupedTag[]>({
    queryKey: ["allTagsGrouped"],
    queryFn: getAllTagsGrouped,
  });

  const tagGridClass = useMemo(() => {
    const base = "grid grid-cols-1 gap-6";
    if (!tagGroups) {
      return `${base} md:grid-cols-2`; // Default while loading
    }
    const count = tagGroups.length;
    switch (count) {
      case 1:
        return `${base} md:grid-cols-1`;
      case 2:
        return `${base} md:grid-cols-2`;
      case 3:
        return `${base} md:grid-cols-3`; // 3 columns for 3 items
      case 4:
        return `${base} md:grid-cols-2`; // 2x2 grid for 4 items
      default:
        // Responsive fallback for 5+ items
        return `${base} md:grid-cols-2 lg:grid-cols-3`;
    }
  }, [tagGroups]);

  // MODIFIED: Dynamically build the validation schema based on fetched groups
  const dynamicSchema = useMemo(() => {
    if (!tagGroups) return baseSchema;
    const groupSchemas = tagGroups.reduce((acc, group) => {
      return { ...acc, [group.name.replace(/\s+/g, "_")]: z.array(z.string()).min(1, { message: `Select at least one ${group.name}.` }) };
    }, {});
    return baseSchema.extend(groupSchemas);
  }, [tagGroups]);

  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
    },
  });

  const editor = useConfiguredEditor(
    article?.html || "",
    () => {},
    (editor) => {
      form.setValue("content", editor.getHTML(), { shouldDirty: true });
    }
  );

  // MODIFIED: Effect to populate the form once BOTH article and tag groups are loaded
  useEffect(() => {
    if (article && tagGroups) {
      // Map the article's flat tag array back to their respective groups
      const defaultTagValues = tagGroups.reduce((acc, group) => {
        const groupKey = group.name.replace(/\s+/g, "_");
        const groupTagNames = new Set(group.tags.map(t => t.name));
        const selectedTagsForGroup = article.tags
          .map(t => t.name)
          .filter(tagName => groupTagNames.has(tagName));
        
        return { ...acc, [groupKey]: selectedTagsForGroup };
      }, {});
      
      form.reset({
        title: article.title,
        description: article.description || article.excerpt,
        content: article.html,
        ...defaultTagValues,
      });

      if (editor && !editor.isDestroyed && editor.getHTML() !== article.html) {
        editor.commands.setContent(article.html);
      }
    }
  }, [article, tagGroups, form, editor]);

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

  // MODIFIED: onSubmit to handle dynamic form data
  const onSubmit = (data: z.infer<typeof dynamicSchema>) => {
    // Flatten all selected tags from the dynamic fields into a single array
    const allSelectedTags: string[] = [];
    if (tagGroups) {
      tagGroups.forEach((group) => {
        const groupKey = group.name.replace(/\s+/g, "_") as keyof typeof data;
        const selected = data[groupKey];
        if (Array.isArray(selected)) {
          allSelectedTags.push(...selected);
        }
      });
    }

    const payload: PageUpdatePayload = {
      title: data.title,
      description: data.description,
      content: data.content,
      tags: allSelectedTags, // Use the new, flattened array of tags
      parent_id: article?.parentId || undefined, // Keep the original parent_id
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

                {/* MODIFIED: Dynamic Tags Section */}
                <div className="space-y-4 pt-2">
                  <div>
                    <FormLabel className="text-base font-medium text-foreground">Tags</FormLabel>
                    <p className="text-sm text-muted-foreground mt-1">
                      Update the tags to help users find this content.
                    </p>
                  </div>
                  {isLoadingTags ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : (
                    <div className={tagGridClass}>
                      {tagGroups?.map((group) => {
                        const options: MultiSelectOption[] = group.tags.map((tag) => ({ value: tag.name, label: tag.name }));
                        const formFieldName = group.name.replace(/\s+/g, "_") as keyof z.infer<typeof dynamicSchema>;

                        return (
                          <FormField
                            key={group.id}
                            control={form.control}
                            name={formFieldName}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">{group.name}</FormLabel>
                                <FormControl>
                                  <MultiSelect
                                    options={options}
                                    selected={Array.isArray(field.value) ? field.value : []}
                                    onChange={field.onChange}
                                    placeholder={`Select for ${group.name}...`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

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