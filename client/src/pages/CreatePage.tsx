// client/src/pages/CreatePage.tsx
import { useState, useRef, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Upload, Paperclip, X } from "lucide-react";

import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { RichTextEditor, useConfiguredEditor } from "@/components/editor/RichTextEditor";
import { TreeSelect } from "@/components/cms/TreeSelect";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { getAllTags, createPage, PageCreatePayload, uploadAttachment, AttachmentInfo } from "@/lib/api/api-client";

// Validation schema
const createPageSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }),
  description: z.string().min(10, "Description must be at least 10-15 words.").max(150, "Description must be 10-15 words (max 150 chars)."),
  parent_id: z.string().min(1, { message: "You must select a parent category." }),
  tags: z.array(z.string()).min(1, { message: "Select at least one tag." }),
});

type CreatePageFormData = z.infer<typeof createPageSchema>;

interface UploadedFile {
  file: File;
  tempId: string;
  type: 'image' | 'video' | 'pdf' | 'file';
}

export default function CreatePage() {
  const navigate = useNavigate();
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: allTags, isLoading: isLoadingTags } = useQuery({
    queryKey: ['allTags'],
    queryFn: getAllTags,
  });

  const tagOptions: MultiSelectOption[] = allTags ? allTags.map(tag => ({ value: tag.name, label: tag.name })) : [];
  
  // --- Editor and Attachment Setup ---
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Step 1: Immediately start the upload to the server in the background
      const response = await uploadAttachment(file);
      
      const fileType = file.type.startsWith('image/') ? 'image' :
                       file.type.startsWith('video/') ? 'video' :
                       file.type === 'application/pdf' ? 'pdf' : 'file';

      // Step 2: Add the file to our state for the final submission payload
      const newAttachment: UploadedFile = {
        file: file,
        tempId: response.temp_id,
        type: fileType,
      };
      setAttachments(prev => [...prev, newAttachment]);

      // --- THIS IS THE FIX ---
      // Step 3: Decide how to display the attachment in the editor
      if (editor) {
        if (fileType === 'image') {
          // For images, create a local preview and insert it as a visible image
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src) {
              editor.chain().focus().setImage({ src }).run();
            }
          };
          reader.readAsDataURL(file);
        } else {
          // For all other file types (PDF, video), insert the generic placeholder
          editor.chain().focus().setAttachment({
            'data-file-name': file.name,
            'data-attachment-type': fileType,
          }).run();
        }
      }
      // --- END OF FIX ---

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
      event.target.value = "";
    }
  };

  const editor = useConfiguredEditor("", handleFileUpload);
  // --- End Setup ---

  // Form setup
  const form = useForm<CreatePageFormData>({
    resolver: zodResolver(createPageSchema),
    defaultValues: {
      title: "",
      description: "",
      parent_id: "",
      tags: [],
    },
  });

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
  const onSubmit = (data: CreatePageFormData) => {
    const content = editor?.getHTML() || '';
    if (content.length < 50) {
        toast.error("Content is too short", { description: "Content must be at least 50 characters." });
        return;
    }

    const attachmentPayload: AttachmentInfo[] = attachments.map(a => ({
        temp_id: a.tempId,
        file_name: a.file.name,
    }));
    
    const payload: PageCreatePayload = {
      title: data.title,
      description: data.description,
      content: content,
      parent_id: data.parent_id,
      tags: data.tags,
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
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
                      <FormControl>
                        <TreeSelect
                          placeholder="Select a parent category..."
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
                          placeholder={isLoadingTags ? "Loading tags..." : "Select tags..."}
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
                  <p className="text-sm text-muted-foreground mb-2">
                    Write your article below. You can paste images directly into the editor to upload them.
                  </p>
                  <RichTextEditor editor={editor} />
                </div>

                <div className="space-y-4">
                  <FormLabel>Attachments</FormLabel>
                  {attachments.length > 0 && (
                    <div className="rounded-md border p-4 space-y-2">
                      {attachments.map(att => (
                        <div key={att.tempId} className="flex justify-between items-center text-sm">
                          <span className="flex items-center gap-2 truncate text-muted-foreground">
                            <Paperclip className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{att.file.name}</span>
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => {
                              setAttachments(prev => prev.filter(a => a.tempId !== att.tempId));
                              toast.info(`Removed attachment: ${att.file.name}`);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
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
                
                <Button type="submit" disabled={mutation.isPending || isUploading}>
                  {(mutation.isPending || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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