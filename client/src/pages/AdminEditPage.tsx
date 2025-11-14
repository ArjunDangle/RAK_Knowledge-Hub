// client/src/pages/AdminEditPage.tsx
import { useEffect, useMemo } from "react"; // MODIFIED: Added useMemo
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
  getAllTagsGrouped, // MODIFIED: Changed from getAllTags
} from "@/lib/api/api-client";
import { GroupedTag } from "@/lib/types/content"; // MODIFIED: Added GroupedTag type
import {
  RichTextEditor,
  useConfiguredEditor,
} from "@/components/editor/RichTextEditor";
import { TreeSelect } from "@/components/cms/TreeSelect";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { Skeleton } from "@/components/ui/skeleton";

// MODIFIED: Base validation schema without tags
const baseSchema = z.object({
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
});

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
      parent_id: "",
    },
  });

  const editor = useConfiguredEditor(pageDetails?.content || "", () => {});

  // MODIFIED: Effect to populate the form once all data is loaded
  useEffect(() => {
    if (pageDetails && tagGroups) {
      // Map the flat array of existing tags back to their groups for the form
      const defaultTagValues = tagGroups.reduce((acc, group) => {
        const groupKey = group.name.replace(/\s+/g, "_");
        const groupTagNames = new Set(group.tags.map(t => t.name));
        const selectedTagsForGroup = pageDetails.tags.filter(tagName => groupTagNames.has(tagName));
        
        return { ...acc, [groupKey]: selectedTagsForGroup };
      }, {});
      
      form.reset({
        title: pageDetails.title,
        description: pageDetails.description,
        parent_id: pageDetails.parent_id || "",
        ...defaultTagValues,
      });

      if (editor && !editor.isDestroyed && editor.getHTML() !== pageDetails.content) {
        editor.commands.setContent(pageDetails.content);
      }
    }
  }, [pageDetails, tagGroups, form, editor]);

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

  // MODIFIED: onSubmit to handle dynamic form data
  const onSubmit = (data: z.infer<typeof dynamicSchema>) => {
    const content = editor?.getHTML() || "";
    if (content.length < 50) {
      toast.error("Content is too short", {
        description: "Content must be at least 50 characters.",
      });
      return;
    }

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
      content,
      parent_id: data.parent_id,
      tags: allSelectedTags, // Add the flattened array to the payload
    };

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

                {/* MODIFIED: Dynamic Tags Section */}
                <div className="space-y-4">
                  <div>
                    <FormLabel className="text-base font-medium text-foreground">Tags</FormLabel>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ensure at least one tag is selected from each mandatory category.
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