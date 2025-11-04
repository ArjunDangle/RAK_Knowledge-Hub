// client/src/pages/CreatePage.tsx
import { useState } from "react";
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
// --- THIS IS THE FIX: Removed the stray underscore ---
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { RichTextEditor, useConfiguredEditor } from "@/components/editor/RichTextEditor";
import { TreeSelect } from "@/components/cms/TreeSelect";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { getAllTags, createPage, PageCreatePayload, uploadAttachment, AttachmentInfo } from "@/lib/api/api-client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  // Fetch tags for the multi-select
  const { data: allTags, isLoading: isLoadingTags } = useQuery({
    queryKey: ['allTags'],
    queryFn: getAllTags,
  });

  const tagOptions: MultiSelectOption[] = allTags ? allTags.map(tag => ({ value: tag.name, label: tag.name })) : [];
  
  // --- Editor Setup ---
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await uploadAttachment(file);
      
      const fileType = file.type.startsWith('image/') ? 'image' :
                       file.type.startsWith('video/') ? 'video' :
                       file.type === 'application/pdf' ? 'pdf' : 'file';

      const newAttachment: UploadedFile = {
        file: file,
        tempId: response.temp_id,
        type: fileType,
      };
      setAttachments(prev => [...prev, newAttachment]);

      // Insert a placeholder into the editor
      if (editor) {
        editor.chain().focus().setAttachment({
          'data-file-name': file.name,
          'data-attachment-type': fileType,
        }).run();
      }
      toast.success("Attachment uploaded successfully.");

    } catch (error) {
      toast.error("Upload failed", { description: (error as Error).message });
    } finally {
      setIsUploading(false);
    }
  };

  const editor = useConfiguredEditor("", handleFileUpload);
  // --- End Editor Setup ---

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
      navigate(`/article/${data.id}`);
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
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading attachment...
                    </div>
                  )}
                </div>

                <Alert>
                  <Paperclip className="h-4 w-4" />
                  <AlertTitle>Attachments</AlertTitle>
                  <AlertDescription>
                    {attachments.length === 0 ? "No attachments uploaded." : (
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            {attachments.map(att => (
                                <li key={att.tempId} className="flex justify-between items-center">
                                    <span>{att.file.name}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                        // This just removes from the list. It doesn't delete from the server.
                                        // Deleting from editor is a separate action.
                                        setAttachments(prev => prev.filter(a => a.tempId !== att.tempId));
                                    }}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}
                  </AlertDescription>
                </Alert>
                
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

