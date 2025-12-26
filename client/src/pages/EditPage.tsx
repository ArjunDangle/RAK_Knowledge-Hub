// client/src/pages/EditPage.tsx
import { useEffect, useState, useRef, ChangeEvent } from "react";
import { useParams } from "react-router-dom"; // Removed useNavigate
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Upload, Paperclip, X, CheckCircle2 } from "lucide-react";

import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { getArticleById, updatePage, PageUpdatePayload, uploadAttachment, AttachmentInfo } from "@/lib/api/api-client";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useConfiguredEditor } from "@/components/editor/useEditorConfig";
import { ArticleCardSkeleton } from "@/components/ui/loading-skeleton";

const baseSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }),
  description: z.string().min(10, "Description must be at least 10 characters.").max(150, "Description must be 10-15 words (max 150 chars)."),
  content: z.string().min(50, { message: "Content must be at least 50 characters." }),
});

interface UploadedFile {
  file: File;
  tempId: string;
  type: "image" | "video" | "pdf" | "file";
}

export default function EditPage() {
  const { pageId } = useParams<{ pageId: string }>();
  
  // 1. Add explicit state to block queries
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: (data: PageUpdatePayload & { pageId: string }) => 
      updatePage(data.pageId, data),
    onSuccess: () => {
      // 2. Lock the component immediately
      setIsSubmitted(true);

      toast.success("Changes submitted for review", {
        description: "Redirecting to home...",
        duration: 2000,
      });
      
      // 3. NUCLEAR OPTION: Hard redirect.
      // This kills the React app context for this page immediately, 
      // preventing any background 404s from overriding us.
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error("Failed to update page", {
        description: error.message || "Please try again later.",
      });
    },
  });

  // --- QUERY ---
  const { data: article, isLoading: isArticleLoading } = useQuery({
    queryKey: ["article", pageId],
    queryFn: () => getArticleById(pageId!),
    // 4. BLOCKER: If isSubmitted is true, this query CANNOT run.
    enabled: !!pageId && !isSubmitted && !mutation.isPending, 
    staleTime: 0, 
    retry: false, // Don't retry if it fails
  });

  const form = useForm<z.infer<typeof baseSchema>>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
    },
  });

  const editor = useConfiguredEditor(article?.html || "", (editor) => {
    const html = editor.getHTML();
    form.setValue("content", html, { shouldDirty: true });
  });

  useEffect(() => {
    if (article) {
      form.reset({
        title: article.title,
        description: article.description || article.excerpt,
        content: article.html,
      });
      if (editor && !editor.getText()) {
        editor.commands.setContent(article.html);
      }
    }
  }, [article, form, editor]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await uploadAttachment(file);
      const fileType = file.type.startsWith("image/") ? "image" : 
                       file.type.startsWith("video/") ? "video" : 
                       file.type === "application/pdf" ? "pdf" : "file";

      const newAttachment: UploadedFile = {
        file: file,
        tempId: response.temp_id,
        type: fileType,
      };
      setAttachments((prev) => [...prev, newAttachment]);

      if (editor) {
        if (fileType === "image") {
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              editor
                .chain()
                .focus()
                .setAttachment({
                  "data-file-name": file.name,
                  "data-attachment-type": "image",
                  "data-temp-id": response.temp_id,
                  src: e.target.result as string, 
                })
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
              "data-temp-id": response.temp_id,
            })
            .run();
        }
      }
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload attachment");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const onSubmit = async (values: z.infer<typeof baseSchema>) => {
    if (!pageId) return;

    // --- CLEANING LOGIC ---
    const cleanContent = (html: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const elements = doc.querySelectorAll('div[data-attachment-type], img');

      elements.forEach((el) => {
        if (el.hasAttribute('data-file-name')) {
          el.removeAttribute('src'); 
        } 
        else if (el.tagName.toLowerCase() === 'img') {
           const src = el.getAttribute('src');
           if (src && (src.includes('/api/') || src.includes('localhost') || src.startsWith('blob:'))) {
             if (!el.hasAttribute('data-file-name')) {
                const filename = src.split('/').pop()?.split('?')[0];
                if (filename) el.setAttribute('data-file-name', decodeURIComponent(filename));
             }
             el.removeAttribute('src');
           }
        }
      });
      return doc.body.innerHTML;
    };

    const cleanedContent = cleanContent(values.content);

    const payloadAttachments: AttachmentInfo[] = attachments.map((a) => ({
      temp_id: a.tempId,
      file_name: a.file.name,
    }));

    mutation.mutate({
      pageId,
      title: values.title,
      description: values.description,
      content: cleanedContent,
      attachments: payloadAttachments,
    });
  };

  // 5. SAFETY RENDER: If submitted, show nothing or a loading spinner
  // This ensures no 404s can be rendered by child components
  if (isSubmitted) {
    return (
      <KnowledgeLayout>
        <div className="container mx-auto py-20 text-center">
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 animate-pulse" />
            <h2 className="text-2xl font-bold">Success!</h2>
            <p className="text-muted-foreground">Redirecting you to home...</p>
          </div>
        </div>
      </KnowledgeLayout>
    );
  }

  if (isArticleLoading) {
    return (
      <KnowledgeLayout>
        <div className="container mx-auto py-8 max-w-5xl">
          <ArticleCardSkeleton />
        </div>
      </KnowledgeLayout>
    );
  }

  return (
    <KnowledgeLayout>
      <div className="container mx-auto py-8 max-w-5xl">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Edit Page</CardTitle>
            <CardDescription>Update the content of your documentation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. How to configure WisGate" {...field} />
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
                      <FormLabel>Short Description (Excerpt)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief summary for search results (10-15 words)" 
                          className="resize-none h-24" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Content</FormLabel>
                  <div className="border rounded-md min-h-[500px]">
                    <RichTextEditor 
                      editor={editor} 
                      title={form.watch("title")}
                      onUpload={async (file) => {
                        await handleFileUpload(file);
                        return "";
                      }}
                      attachments={attachments.map(a => ({...a, file: a.file}))} 
                      onRemoveAttachment={(tempId) => setAttachments(prev => prev.filter(p => p.tempId !== tempId))}
                    />
                  </div>
                  {form.formState.errors.content && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.content.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">New Attachments Queue</span>
                    <span className="text-xs text-muted-foreground">{attachments.length} files ready</span>
                  </div>
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((att) => (
                        <div key={att.tempId} className="flex items-center gap-2 bg-background border px-3 py-1.5 rounded-full text-xs shadow-sm animate-in fade-in zoom-in duration-300">
                          <Paperclip className="h-3 w-3 text-primary" />
                          <span className="max-w-[150px] truncate">{att.file.name}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-5 w-5 rounded-full hover:bg-destructive/10 hover:text-destructive -mr-1" 
                            onClick={() => setAttachments(prev => prev.filter(a => a.tempId !== att.tempId))}
                            type="button"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      Add Attachment
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-4">
                  <Button type="submit" disabled={mutation.isPending || isSubmitted || !form.formState.isDirty}>
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                  <Button variant="outline" type="button" onClick={() => window.history.back()}>
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