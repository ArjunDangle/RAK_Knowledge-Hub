// client/src/pages/CreatePage.tsx
import { useState, useRef, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Loader2, Paperclip, X, Tag as TagIcon } from "lucide-react";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { createPage, PageCreatePayload, uploadAttachment, AttachmentInfo, getAllTags } from "@/lib/api/api-client";
import { Tag } from "@/lib/types/content";
import { RichTextEditor, useConfiguredEditor } from "@/components/editor/RichTextEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TreeSelect } from "@/components/cms/TreeSelect";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const createPageSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters long." }),
  parent_id: z.string({ required_error: "Please select a parent category." }),
  tags: z.string().optional(),
});
type CreatePageFormData = z.infer<typeof createPageSchema>;

export default function CreatePage() {
    const navigate = useNavigate();
    const [attachments, setAttachments] = useState<AttachmentInfo[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [tagInputValue, setTagInputValue] = useState('');
    const [currentTags, setCurrentTags] = useState<string[]>([]);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [temporarySelectedTags, setTemporarySelectedTags] = useState<Set<string>>(new Set());

    const attachmentMutation = useMutation({
        mutationFn: uploadAttachment,
        onSuccess: (data) => {
            // --- THIS IS THE FIX ---
            // Only update the state. The editor plugin is now responsible for all visual insertions.
            setAttachments(prev => [...prev, data]);
            toast.success(`File "${data.file_name}" processed.`);
        },
        onError: (error) => {
            toast.error("Upload failed", { description: error.message });
        },
    });

    const editor = useConfiguredEditor('', attachmentMutation.mutate);

    const { data: allTags } = useQuery({
        queryKey: ['allTags'],
        queryFn: getAllTags,
    });

    const form = useForm<CreatePageFormData>({
        resolver: zodResolver(createPageSchema),
        defaultValues: { title: "", parent_id: "", tags: "" },
    });

    useEffect(() => {
        form.setValue('tags', currentTags.join(','));
    }, [currentTags, form]);

    const groupedTags = useMemo(() => {
        if (!allTags) return {};
        const groups: { [key: string]: Tag[] } = { 'A-C': [], 'D-L': [], 'M-R': [], 'S-Z': [], '#': [] };
        allTags.forEach(tag => {
            const firstLetter = tag.name[0]?.toUpperCase();
            if (firstLetter >= 'A' && firstLetter <= 'C') groups['A-C'].push(tag);
            else if (firstLetter >= 'D' && firstLetter <= 'L') groups['D-L'].push(tag);
            else if (firstLetter >= 'M' && firstLetter <= 'R') groups['M-R'].push(tag);
            else if (firstLetter >= 'S' && firstLetter <= 'Z') groups['S-Z'].push(tag);
            else groups['#'].push(tag);
        });
        return Object.fromEntries(Object.entries(groups).filter(([, tags]) => tags.length > 0));
    }, [allTags]);

    const handleAddTag = (tagToAdd: string) => {
        const newTag = tagToAdd.trim().replace(/,/g, '');
        if (newTag && !currentTags.includes(newTag)) {
            setCurrentTags(prev => [...prev, newTag]);
        }
        setTagInputValue('');
    };

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
    
    const handleRemoveTag = (tagToRemove: string) => {
        setCurrentTags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            handleAddTag(tagInputValue);
        }
    };

    const handleModalOpen = (isOpen: boolean) => {
        if (isOpen) {
            setTemporarySelectedTags(new Set(currentTags));
        }
        setIsTagModalOpen(isOpen);
    };

    const handleTemporaryTagToggle = (tagName: string) => {
        setTemporarySelectedTags(prev => {
            const newSet = new Set(prev);
            newSet.has(tagName) ? newSet.delete(tagName) : newSet.add(tagName);
            return newSet;
        });
    };

    const handleApplyTagSelection = () => {
      setCurrentTags(Array.from(temporarySelectedTags));
      setIsTagModalOpen(false);
    }

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
            tags: currentTags.filter(Boolean),
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
                                    <FormItem>
                                        <FormLabel>Tags</FormLabel>
                                        <FormControl>
                                            <div className="flex items-center gap-2 flex-wrap p-2 border rounded-md min-h-[40px]">
                                                {currentTags.map((tag) => (
                                                    <Badge key={tag} variant="secondary">
                                                        {tag}
                                                        <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1.5 rounded-full hover:bg-background/50 p-0.5">
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                                <Input value={tagInputValue} onChange={(e) => setTagInputValue(e.target.value)} onKeyDown={handleTagInputKeyDown} placeholder="Add a tag..." className="border-none focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[120px] h-auto p-0" />
                                            </div>
                                        </FormControl>
                                        <div className="flex justify-between items-start mt-2">
                                            <p className="text-xs text-muted-foreground">Type a tag and press Enter, or select existing ones.</p>
                                            <Button type="button" variant="outline" size="sm" onClick={() => handleModalOpen(true)}>
                                                <TagIcon className="mr-2 h-4 w-4" />
                                                Browse Tags
                                            </Button>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}  />
                                
                                <div className="flex items-center gap-4">
                                    <Button type="submit" disabled={pageMutation.isPending}>
                                        {pageMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Submit for Review
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
            
            <Dialog open={isTagModalOpen} onOpenChange={handleModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Select Tags</DialogTitle>
                        <DialogDescription>Select one or more existing tags, or create new ones in the input field.</DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="h-[60vh] rounded-md border p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                            {Object.entries(groupedTags).map(([groupName, tagsInGroup]) => (
                                <div key={groupName} className="space-y-2">
                                    <h4 className="font-semibold text-sm text-muted-foreground border-b pb-1 mb-2">{groupName}</h4>
                                    <div className="flex flex-col items-start space-y-1">
                                        {(tagsInGroup as Tag[]).map(tag => (
                                            <button key={tag.id} type="button" onClick={() => handleTemporaryTagToggle(tag.name)} className={cn("text-sm text-foreground text-left rounded-sm px-1 -mx-1 hover:bg-accent w-full", temporarySelectedTags.has(tag.name) && "bg-accent text-accent-foreground font-semibold")}>
                                                {tag.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <DialogFooter><Button variant="ghost" onClick={() => setIsTagModalOpen(false)}>Cancel</Button><Button onClick={handleApplyTagSelection}>Apply Tags</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </KnowledgeLayout>
    );
}