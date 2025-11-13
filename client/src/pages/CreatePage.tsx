// client/src/pages/CreatePage.tsx
import { useState, useRef, ChangeEvent, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Upload, Paperclip, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

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
  RichTextEditor,
  useConfiguredEditor,
} from "@/components/editor/RichTextEditor";
import { TreeSelect } from "@/components/cms/TreeSelect";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import {
  getAllTagsGrouped, // Changed from getAllTags
  createPage,
  PageCreatePayload,
  uploadAttachment,
  AttachmentInfo,
} from "@/lib/api/api-client";
import { GroupedTag } from "@/lib/types/content"; // Add this new type import

// Define base schema that is always required
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
}

export default function CreatePage() {
  const navigate = useNavigate();
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAllowedOnly, setShowAllowedOnly] = useState(false);

  // 1. Fetch the structured tag groups
  const { data: tagGroups, isLoading: isLoadingTags } = useQuery<GroupedTag[]>({
    queryKey: ["allTagsGrouped"],
    queryFn: getAllTagsGrouped,
  });

  // 2. Dynamically build the validation schema based on fetched groups
  const dynamicSchema = useMemo(() => {
    if (!tagGroups) return baseSchema;
    const groupSchemas = tagGroups.reduce((acc, group) => {
      return {
        ...acc,
        // Use a valid key for the schema object
        [group.name.replace(/\s+/g, "_")]: z
          .array(z.string())
          .min(1, { message: `You must select at least one ${group.name}.` }),
      };
    }, {});
    return baseSchema.extend(groupSchemas);
  }, [tagGroups]);

  // 3. Initialize the form with the dynamic schema
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      title: "",
      description: "",
      parent_id: "",
    },
  });

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await uploadAttachment(file);
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type === "application/pdf"
        ? "pdf"
        : "file";

      setAttachments((prev) => [
        ...prev,
        { file: file, tempId: response.temp_id },
      ]);

      if (editor) {
        if (fileType === "image") {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              editor
                .chain()
                .focus()
                .setImage({ src: e.target.result as string })
                .run();
            }
          };
          reader.readAsDataURL(file);
        } else {
          editor
            .chain()
            .focus()
            .setAttachment({
              "data-file-name": file.name,
              "data-attachment-type": fileType,
            })
            .run();
        }
      }
      toast.success("Attachment uploaded successfully.");
    } catch (error) {
      toast.error("Upload failed", { description: (error as Error).message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    if (event.target) {
      event.target.value = ""; // Reset file input
    }
  };

  const editor = useConfiguredEditor("", handleFileUpload);

  // Mutation for creating the page
  const mutation = useMutation({
    mutationFn: (data: PageCreatePayload) => createPage(data),
    onSuccess: (data) => {
      toast.success("Article submitted for review!");
      navigate(`/article/${data.id}?status=pending`);
    },
    onError: (error) => {
      toast.error("Submission failed", { description: error.message });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof dynamicSchema>) => {
    const content = editor?.getHTML() || "";
    if (content.length < 50) {
      toast.error("Content is too short", {
        description: "Content must be at least 50 characters.",
      });
      return;
    }

    const attachmentPayload: AttachmentInfo[] = attachments.map((a) => ({
      temp_id: a.tempId,
      file_name: a.file.name,
    }));

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

    const payload: PageCreatePayload = {
      title: data.title,
      description: data.description,
      content: content,
      parent_id: data.parent_id,
      tags: allSelectedTags, // Use the flattened array
      attachments: attachmentPayload,
    };

    mutation.mutate(payload);
  };

  const breadcrumbs = [{ label: "Create New Article" }];

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Article</CardTitle>
            <CardDescription>
              Fill out the details below to submit a new article for review.
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
                          allowedOnly={showAllowedOnly} // Pass the state as a prop
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags Section */}
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
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="space-y-2">
                          <Skeleton className="h-5 w-1/3" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <FormLabel className="text-sm font-medium text-foreground">
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
                  <RichTextEditor editor={editor} />
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
                            onClick={() => {
                              setAttachments((prev) =>
                                prev.filter((a) => a.tempId !== att.tempId)
                              );
                              toast.info(
                                `Removed attachment: ${att.file.name}`
                              );
                            }}
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
