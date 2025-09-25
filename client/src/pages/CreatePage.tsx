// client/src/pages/CreatePage.tsx
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, Paperclip, Code } from "lucide-react";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { createPage, PageCreatePayload, uploadAttachment, AttachmentInfo } from "@/lib/api/api-client";
import { RichTextEditor, useConfiguredEditor } from "@/components/editor/RichTextEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TreeSelect } from "@/components/cms/TreeSelect";

const createPageSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }),
  parent_id: z.string({ required_error: "Please select a parent category." }),
  tags: z.string().optional(),
});
type CreatePageFormData = z.infer<typeof createPageSchema>;

export default function CreatePage() {
    const navigate = useNavigate();
    const editor = useConfiguredEditor();
    const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isHtmlModalOpen, setIsHtmlModalOpen] = useState(false);
    const [rawHtml, setRawHtml] = useState("");

    const form = useForm<CreatePageFormData>({
        resolver: zodResolver(createPageSchema),
        defaultValues: { title: "", parent_id: "", tags: "" },
    });

    const attachmentMutation = useMutation({
        mutationFn: uploadAttachment,
        onSuccess: (data) => {
            setAttachments(prev => [...prev, data]);
            toast.success(`File "${data.file_name}" uploaded successfully.`);
            
            const extension = data.file_name.split('.').pop()?.toLowerCase();
            let attachmentType = 'file';

            if (['png', 'jpg', 'jpeg', 'gif'].includes(extension || '')) {
                attachmentType = 'image';
            } else if (extension === 'pdf') {
                attachmentType = 'pdf';
            } else if (['mp4', 'mov', 'avi', 'webm'].includes(extension || '')) {
                attachmentType = 'video';
            }

            editor?.chain().focus().setAttachment({ 
                'data-file-name': data.file_name,
                'data-attachment-type': attachmentType 
            }).run();
        },
        onError: (error) => {
            toast.error("Upload failed", { description: error.message });
        },
    });

    const pageMutation = useMutation({
        mutationFn: createPage,
        onSuccess: () => {
            toast.success("Article submitted for review!");
            navigate("/");
        },
        onError: (error) => {
            toast.error("Submission failed", { description: error.message });
        },
    });
    
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            attachmentMutation.mutate(file);
        }
    };

    const handleShowHtml = () => {
        const currentHtml = editor?.getHTML() || '';
        setRawHtml(currentHtml);
        setIsHtmlModalOpen(true);
    };

    const onSubmit = (data: CreatePageFormData) => {
        const content = editor?.getHTML() || '';
        if (content.length < 50 && attachments.length === 0) {
            form.setError("root", { message: "Content must be at least 50 characters, or have an attachment." });
            return;
        }

        const payload: PageCreatePayload = {
            title: data.title,
            parent_id: data.parent_id,
            content: content,
            tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
            attachments: attachments,
        };
        pageMutation.mutate(payload);
    };

    return (
        <KnowledgeLayout breadcrumbs={[{ label: "Create New Content" }]}>
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Submit a New Article</CardTitle>
                        <CardDescription>
                            Fill out the form below to create a new article. It will be sent for review before publication.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField control={form.control} name="title" render={({ field }) => (
                                    <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., How to Configure the WisGate Edge Lite 2" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                
                                <FormField control={form.control} name="parent_id" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Parent Category</FormLabel>
                                        <FormControl>
                                            <TreeSelect
                                                value={field.value}
                                                onChange={field.onChange}
                                                placeholder="Select a parent page..."
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                
                                <div>
                                    <FormLabel>Content</FormLabel>
                                    <RichTextEditor editor={editor} />
                                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,video/*,.pdf" />
                                    <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => fileInputRef.current?.click()} disabled={attachmentMutation.isPending}>
                                        <Paperclip className="mr-2 h-4 w-4" />
                                        {attachmentMutation.isPending ? 'Uploading...' : 'Attach File'}
                                    </Button>
                                    {form.formState.errors.root && <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>}
                                </div>
                                
                                <FormField control={form.control} name="tags" render={({ field }) => (
                                    <FormItem><FormLabel>Tags</FormLabel><FormControl><Input placeholder="e.g., getting-started, configuration, api" {...field} /></FormControl><p className="text-xs text-muted-foreground">Enter comma-separated tags.</p><FormMessage /></FormItem>
                                )} />
                                
                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={pageMutation.isPending}>
                                        {pageMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit for Review
                                    </Button>
                                    <Button type="button" variant="destructive" size="sm" onClick={handleShowHtml}>
                                        <Code className="mr-2 h-4 w-4" />
                                        View Raw HTML
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={isHtmlModalOpen} onOpenChange={setIsHtmlModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Raw HTML Content</DialogTitle>
                        <DialogDescription>This is the exact HTML that will be sent to the backend for translation.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] rounded-md border p-4">
                        <pre className="text-sm"><code>{rawHtml}</code></pre>
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </KnowledgeLayout>
    );
}