// client/src/pages/CreatePage.tsx
import { useState, useRef, ChangeEvent, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Loader2,
  Upload,
  Paperclip,
  X,
  MessageSquareWarning,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { API_BASE_URL } from "@/lib/api/api-client"; 
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
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useConfiguredEditor } from "@/components/editor/useEditorConfig"; // Direct import
import { TreeSelect } from "@/components/cms/TreeSelect";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import {
  getAllTagsGrouped,
  createPage,
  updatePage,
  getArticleById,
  PageCreatePayload,
  PageUpdatePayload,
  uploadAttachment,
  AttachmentInfo,
  getMySubmissions,
} from "@/lib/api/api-client";
import { GroupedTag } from "@/lib/types/content";

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


interface UploadedFile {
  file: File;
  tempId: string;
  type: "image" | "video" | "pdf" | "file";
}

export default function CreatePage() {
  const navigate = useNavigate();
  const { pageId } = useParams<{ pageId?: string }>();
  const isEditMode = !!pageId;

  const { data: existingArticle, isLoading: isLoadingArticle } = useQuery({
    queryKey: ["articleForEdit", pageId],
    queryFn: () => getArticleById(pageId!),
    enabled: isEditMode,
    retry: false,
  });

  const [attachments, setAttachments] = useState<UploadedFile[]>([]);

  // client/src/pages/CreatePage.tsx (and AdminEditPage)

const handleRemoveAttachment = (tempId: string) => {
  // 1. Remove from the bottom UI list state
  setAttachments((prev) => prev.filter((a) => a.tempId !== tempId));

  // 2. Sync with Editor: Find and delete the node with this tempId
  if (editor) {
    editor.state.doc.descendants((node, pos) => {
      if (
        node.type.name === 'attachmentNode' && 
        node.attrs['data-temp-id'] === tempId
      ) {
        editor.chain()
          .deleteRange({ from: pos, to: pos + node.nodeSize })
          .focus()
          .run();
        
        return false; // Found it, stop searching
      }
      return true; // Keep searching
    });
  }
  toast.info("Attachment removed");
};

  const { data: submissionDetails } = useQuery({
    queryKey: ["mySubmissions"],
    queryFn: getMySubmissions,
    enabled: isEditMode,
    select: (data) => data.find((sub) => sub.confluencePageId === pageId),
  });

  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAllowedOnly, setShowAllowedOnly] = useState(false);

  const { data: tagGroups, isLoading: isLoadingTags } = useQuery<GroupedTag[]>({
    queryKey: ["allTagsGrouped"],
    queryFn: getAllTagsGrouped,
  });

  const tagGridClass = useMemo(() => {
    const base = "grid grid-cols-1 gap-6";
    if (!tagGroups) {
      return `${base} md:grid-cols-2`;
    }
    const count = tagGroups.length;
    switch (count) {
      case 1:
        return `${base} md:grid-cols-1`;
      case 2:
        return `${base} md:grid-cols-2`;
      case 3:
        return `${base} md:grid-cols-3`;
      case 4:
        return `${base} md:grid-cols-2`;
      default:
        return `${base} md:grid-cols-2 lg:grid-cols-3`;
    }
  }, [tagGroups]);

  const dynamicSchema = useMemo(() => {
    if (!tagGroups) return baseSchema;
    const groupSchemas = tagGroups.reduce((acc, group) => {
      return {
        ...acc,
        [group.name.replace(/\s+/g, "_")]: z
          .array(z.string())
          .min(1, { message: `You must select at least one ${group.name}.` }),
      };
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

  /**
   * FIXED: Added return type Promise<string> to satisfy RichTextEditor requirements.
   * Returns the preview URL for the uploaded attachment.
   */

  const API_BASE_URL = "https://rak-knowledge-hub.rak-internal.net/api";

  // 1. Keep handleFileUpload as the "Source of Truth" for insertion
const handleFileUpload = async (file: File): Promise<string> => {
  setIsUploading(true);
  try {
    const response = await uploadAttachment(file);
    const fileType = file.type.startsWith("image/") ? "image" 
                   : file.type.startsWith("video/") ? "video" 
                   : file.type === "application/pdf" ? "pdf" 
                   : "file";

    const newAttachment: UploadedFile = {
      file: file,
      tempId: response.temp_id,
      type: fileType,
    };
    
    setAttachments((prev) => [...prev, newAttachment]);

    const previewUrl = `${API_BASE_URL}/cms/attachments/preview/${response.temp_id}`;

    if (editor) {
      // THIS IS THE ONLY PLACE INSERTION SHOULD HAPPEN
      editor.chain()
        .focus()
        .insertContent([
          {
            type: 'attachmentNode',
            attrs: {
              "data-file-name": file.name,
              "data-attachment-type": fileType,
              "src": previewUrl ,
              "data-temp-id": response.temp_id
            }
          },
          { type: 'paragraph' } 
        ])
        .run();
    }

    return previewUrl;
  } catch (error) {
    toast.error(`Could not attach ${file.name}`);
    throw error;
  } finally {
    setIsUploading(false);
  }
};

// 2. Simplified handleFileSelect (Removes the double-insertion)
const handleFileSelect = async (event: ChangeEvent<HTMLInputElement>) => {
  const files = event.target.files;
  if (files && files.length > 0 && editor) {
    
    // Safety: Move cursor if an attachment is currently selected
    if (editor.isActive('attachmentNode')) {
      editor.commands.setTextSelection(editor.state.selection.to);
      editor.commands.createParagraphNear();
    }

    for (const file of Array.from(files)) {
      try {
        // Just call handleFileUpload. It handles the list AND the editor.
        await handleFileUpload(file); 
      } catch (e) {
        console.error("Selection upload failed:", e);
      }
    }
  }
  
  if (event.target) {
    event.target.value = "";
  }
};


  const editor = useConfiguredEditor("", (editorInstance) => {
    console.log("Content updated");
  });

  const watchedTitle = form.watch("title");

  useEffect(() => {
    if (isEditMode && existingArticle && tagGroups && editor) {
      const defaultTagValues = tagGroups.reduce((acc, group) => {
        const groupKey = group.name.replace(/\s+/g, "_");
        const groupTagNames = new Set(group.tags.map((t) => t.name));
        const selectedTags = existingArticle.tags
          .map((t) => t.name)
          .filter((tagName) => groupTagNames.has(tagName));
        return { ...acc, [groupKey]: selectedTags };
      }, {});

      form.reset({
        title: existingArticle.title,
        description: existingArticle.description || existingArticle.excerpt,
        parent_id: existingArticle.parentId || "",
        ...defaultTagValues,
      });

      if (!editor.isDestroyed && editor.getHTML() !== existingArticle.html) {
        editor.commands.setContent(existingArticle.html);
      }
    }
  }, [isEditMode, existingArticle, tagGroups, form, editor]);

  const createMutation = useMutation({
    mutationFn: (data: PageCreatePayload) => createPage(data),
    onSuccess: (data) => {
      toast.success("Article submitted for review!");
      navigate(`/article/${data.id}?status=pending`);
    },
    onError: (error) =>
      toast.error("Submission failed", { description: error.message }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: PageUpdatePayload) => updatePage(pageId!, data),
    onSuccess: () => {
      toast.success("Article updated and resubmitted for review!");
      navigate("/my-submissions");
    },
    onError: (error) =>
      toast.error("Update failed", { description: error.message }),
  });

  const mutation = isEditMode ? updateMutation : createMutation;

  const onSubmit = (data: z.infer<typeof dynamicSchema>) => {
    const content = editor?.getHTML() || "";
    if (content.length < 50) {
      toast.error("Content is too short", { description: "Content must be at least 50 characters." });
      return;
    }
  
    const allSelectedTags: string[] = [];
    if (tagGroups) {
      tagGroups.forEach((group) => {
        const groupKey = group.name.replace(/\s+/g, "_") as keyof typeof data;
        if (Array.isArray(data[groupKey])) {
          allSelectedTags.push(...(data[groupKey] as string[]));
        }
      });
    }
  
    const attachmentPayload: AttachmentInfo[] = attachments.map((a) => ({
      temp_id: a.tempId,
      file_name: a.file.name,
    }));
  
    if (isEditMode) {
      const payload: PageUpdatePayload = {
        title: data.title,
        description: data.description,
        content: content,
        parent_id: data.parent_id,
        tags: allSelectedTags,
        attachments: attachmentPayload,
      };
      updateMutation.mutate(payload);
    } else {
      const payload: PageCreatePayload = {
        title: data.title,
        description: data.description,
        content: content,
        parent_id: data.parent_id,
        tags: allSelectedTags,
        attachments: attachmentPayload,
      };
      createMutation.mutate(payload);
    }
  };

  const breadcrumbs = [
    { label: isEditMode ? "Edit Submission" : "Create New Article" },
  ];

  if (isLoadingArticle) {
    return (
      <KnowledgeLayout breadcrumbs={breadcrumbs}>
        <div className="text-center p-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">
            Loading article for editing...
          </p>
        </div>
      </KnowledgeLayout>
    );
  }

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditMode
                ? `Edit: ${existingArticle?.title}`
                : "Create New Article"}
            </CardTitle>
            <CardDescription>
              {isEditMode
                ? "Modify your submission and save to resubmit it for review."
                : "Fill out the details below to submit a new article for review."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditMode && submissionDetails?.rejectionComment && (
              <Alert variant="destructive" className="mb-6">
                <MessageSquareWarning className="h-4 w-4" />
                <AlertTitle>Admin Feedback</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">
                  {submissionDetails.rejectionComment}
                </AlertDescription>
              </Alert>
            )}

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
                        <Input placeholder="Your article's title" {...field} />
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
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <div className="flex items-center space-x-2 mb-2">
                        <Checkbox
                          id="show-allowed-only"
                          checked={showAllowedOnly}
                          onCheckedChange={(checked) =>
                            setShowAllowedOnly(checked as boolean)
                          }
                        />
                        <Label
                          htmlFor="show-allowed-only"
                          className="text-sm font-normal"
                        >
                          Show only sections I can edit
                        </Label>
                      </div>
                      <FormControl>
                        <TreeSelect
                          placeholder="Select a parent category..."
                          value={field.value}
                          onChange={field.onChange}
                          allowedOnly={showAllowedOnly}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Tags
                    </FormLabel>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select at least one tag from each of the following
                      mandatory categories to help users find your content.
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
                        const options: MultiSelectOption[] = group.tags.map(
                          (tag) => ({
                            value: tag.name,
                            label: tag.name,
                          })
                        );

                        const formFieldName = group.name.replace(
                          /\s+/g,
                          "_"
                        ) as keyof z.infer<typeof dynamicSchema>;

                        return (
                          <FormField
                            key={group.id}
                            control={form.control}
                            name={formFieldName}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">
                                  {group.name}
                                </FormLabel>
                                <FormControl>
                                  <MultiSelect
                                    options={options}
                                    selected={
                                      Array.isArray(field.value)
                                        ? field.value
                                        : []
                                    }
                                    onChange={field.onChange}
                                    placeholder={`Select tag(s) for ${group.name}...`}
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

                <Separator className="my-8" />

                <div>
                  <FormLabel>Content</FormLabel>
                  <p className="text-sm text-muted-foreground mb-2">
                    Write your article below. You can paste images directly into
                    the editor to upload them.
                  </p>
                  <RichTextEditor editor={editor} title={watchedTitle} onUpload={handleFileUpload}  />
                </div>

                <div className="space-y-4">
                  <FormLabel>Attachments</FormLabel>
                  {attachments.length > 0 && (
                    <div className="rounded-md border p-4 space-y-2">
                      {attachments.map((att) => (
                        <div
                          key={att.tempId}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="flex items-center gap-2 truncate text-muted-foreground">
                            <Paperclip className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{att.file.name}</span>
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => handleRemoveAttachment(att.tempId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="mr-2 h-4 w-4" />
                      )}
                      Add Attachment
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                      multiple
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={mutation.isPending || isUploading}
                >
                  {(mutation.isPending || isUploading) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditMode ? "Save & Resubmit" : "Submit for Review"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </KnowledgeLayout>
  );
}