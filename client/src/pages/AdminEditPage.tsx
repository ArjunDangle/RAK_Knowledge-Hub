import { useEffect, useMemo, useState, useRef, ChangeEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, Paperclip, X, Save, ArrowLeft } from "lucide-react";

// --- COMPONENTS ---
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
import { toast } from "sonner";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { TreeSelect } from "@/components/cms/TreeSelect";

// --- API & TYPES ---
import {
  getPageDetailsForEdit,
  updatePage,
  PageUpdatePayload,
  getAllTagsGrouped,
  uploadAttachment,
  AttachmentInfo,
} from "@/lib/api/api-client";

// --- EDITOR IMPORTS ---
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

// ✅ CUSTOM EDITOR EXTENSIONS
import { AttachmentNode } from "@/components/editor/extensions/attachmentNode";
import { RichTextEditor, EditorAttachment } from "@/components/editor/RichTextEditor";

// --- SCHEMA DEFINITION ---
const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().optional(),
  parent_id: z.string().min(1, "Category is required"),
});

export default function AdminEditPage() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- STATE ---
  const [attachments, setAttachments] = useState<EditorAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // --- QUERIES ---
  const { data: pageDetails, isLoading: isLoadingPage } = useQuery({
    queryKey: ["adminPageEdit", pageId],
    queryFn: () => getPageDetailsForEdit(pageId!),
    enabled: !!pageId,
  });

  const { data: tagGroups } = useQuery({
    queryKey: ["allTagsGrouped"],
    queryFn: getAllTagsGrouped,
  });

  // --- DYNAMIC FORM SCHEMA (TAGS) ---
  const dynamicSchema = useMemo(() => {
    if (!tagGroups) return formSchema;
    const groupSchemas = tagGroups.reduce((acc, group) => {
      return {
        ...acc,
        [group.name.replace(/\s+/g, "_")]: z.array(z.string()).optional(),
      };
    }, {});
    return formSchema.extend(groupSchemas);
  }, [tagGroups]);

  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {
      title: "",
      description: "",
      parent_id: "",
    },
  });

  // --- EDITOR CONFIGURATION ---
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Underline,
      Image, // Standard Image support
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      // ✅ Register AttachmentNode to handle our custom Files/Images
      AttachmentNode,
    ],
    content: "", 
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
  });

  // --- SYNC DATA: API -> FORM & EDITOR ---
  useEffect(() => {
    if (pageDetails && tagGroups && editor) {
      // 1. Map API Tags to Form Fields
      const defaultTagValues = tagGroups.reduce((acc, group) => {
        const groupKey = group.name.replace(/\s+/g, "_");
        const groupTagNames = new Set(group.tags.map((t) => t.name));
        
        // Filter the page's current tags to see which belong to this group
        const selectedTags = pageDetails.tags.filter((tagName) => groupTagNames.has(tagName));
        
        return { ...acc, [groupKey]: selectedTags };
      }, {});

      // 2. Reset Form
      form.reset({
        title: pageDetails.title,
        description: pageDetails.description || "",
        // Convert number ID to string for the Select component
        parent_id: pageDetails.parent_id ? String(pageDetails.parent_id) : "",
        ...defaultTagValues,
      });

      // 3. Set Editor Content (Only if editor is empty/fresh)
      if (!editor.isDestroyed && editor.isEmpty) {
        editor.commands.setContent(pageDetails.content);
      }
      
      // Note: If you have existing attachments in 'pageDetails', you might want to 
      // map them to 'attachments' state here so they show in the sidebar list.
      // For now, we assume 'attachments' state tracks *new* uploads for this session.
    }
  }, [pageDetails, tagGroups, form, editor]);

  // --- FILE UPLOAD LOGIC (With Base64 Injection) ---
  const handleFileUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      // 1. Upload to Server (Get temp_id)
      const response = await uploadAttachment(file);
      
      // 2. Determine Type
      const fileType = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
        ? "video"
        : file.type === "application/pdf"
        ? "pdf"
        : "file";

      const newAttachment: EditorAttachment = {
        file: file,
        tempId: response.temp_id || crypto.randomUUID(),
        type: fileType as any,
      };

      // 3. Update State (Sidebar)
      setAttachments((prev) => [...prev, newAttachment]);

      // 4. Insert into Editor
      if (editor) {
        if (fileType === "image") {
          // ✅ IMAGE: Read as Base64 for instant preview
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              editor.chain().focus()
                .insertContent([
                  {
                    type: 'attachmentNode',
                    attrs: {
                      'data-file-name': file.name,
                      'data-attachment-type': 'image',
                      'data-temp-id': newAttachment.tempId,
                      'src': e.target.result as string, // Base64 Data
                      'width': '100%'
                    }
                  },
                  { type: 'paragraph' } // Add newline for better UX
                ])
                .run();
            }
          };
          reader.readAsDataURL(file);
        } else {
          // ✅ FILE: Insert standard card node
          editor.chain().focus().setAttachment({
            "data-file-name": file.name,
            "data-attachment-type": fileType,
            "data-temp-id": newAttachment.tempId,
          }).run();
        }
      }
      return "";
    } catch (error) {
      toast.error("Upload failed");
      console.error(error);
      return "";
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Safety check: ensure we aren't stuck inside another node
      if (editor?.isActive("attachmentNode")) {
        editor.commands.setTextSelection(editor.state.selection.to);
        editor.commands.createParagraphNear();
      }
      
      for (const file of Array.from(files)) {
        await handleFileUpload(file);
      }
    }
    if (e.target) e.target.value = "";
  };

  const handleRemoveAttachment = (tempId: string) => {
    setAttachments((prev) => prev.filter((a) => a.tempId !== tempId));
    // Optional: Logic to remove the specific node from editor by ID could go here
  };

  // --- FORM SUBMISSION ---
  const mutation = useMutation({
    mutationFn: (data: PageUpdatePayload) => updatePage(pageId!, data),
    onSuccess: () => {
      toast.success("Page updated successfully");
      queryClient.invalidateQueries({ queryKey: ["adminPageEdit"] });
      navigate("/admin/content");
    },
    onError: (err) => {
      toast.error("Failed to update page: " + err.message);
    },
  });

  const onSubmit = (values: any) => {
    if (!editor) return;
    const content = editor.getHTML();

    // Collect all selected tags from dynamic fields
    const allSelectedTags: string[] = [];
    if (tagGroups) {
      tagGroups.forEach((group) => {
        const groupKey = group.name.replace(/\s+/g, "_");
        if (Array.isArray(values[groupKey])) {
          allSelectedTags.push(...values[groupKey]);
        }
      });
    }

    // Map new attachments
    const attachmentPayload: AttachmentInfo[] = attachments.map((a) => ({
      temp_id: a.tempId,
      file_name: a.file.name,
    }));

    const payload: PageUpdatePayload = {
      title: values.title,
      description: values.description,
      parent_id: values.parent_id,
      content,
      tags: allSelectedTags,
      attachments: attachmentPayload,
    };

    mutation.mutate(payload);
  };

  if (isLoadingPage) {
    return (
      <KnowledgeLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </KnowledgeLayout>
    );
  }

  return (
    <KnowledgeLayout>
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* HEADER */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Edit Article
            </h1>
            <p className="text-muted-foreground mt-2">
              Update content, tags, and settings.
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          
          {/* LEFT COLUMN: EDITOR */}
          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm">
              <CardContent className="p-0">
                {/* Unified Editor Component */}
                <RichTextEditor
                  editor={editor}
                  title={form.watch("title")}
                  onUpload={handleFileUpload}
                  attachments={attachments}
                  onRemoveAttachment={handleRemoveAttachment}
                />
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: METADATA FORM */}
          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-zinc-800 shadow-sm h-fit sticky top-6">
              <CardHeader>
                <CardTitle>Article Details</CardTitle>
                <CardDescription>Update metadata</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    {/* TITLE */}
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

                    {/* CATEGORY (Tree Select) */}
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
                              placeholder="Select Category"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* DESCRIPTION */}
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="min-h-[100px]" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* DYNAMIC TAGS */}
                    {tagGroups?.map((group) => {
                      const options: MultiSelectOption[] = group.tags.map((tag) => ({
                        value: tag.name,
                        label: tag.name,
                      }));
                      const fieldName = group.name.replace(/\s+/g, "_");

                      return (
                        <FormField
                          key={group.id}
                          control={form.control}
                          name={fieldName as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{group.name}</FormLabel>
                              <FormControl>
                                <MultiSelect
                                  options={options}
                                  selected={field.value || []}
                                  onChange={field.onChange}
                                  placeholder={`Select ${group.name}...`}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    })}

                    {/* ATTACHMENT LIST (Sidebar Sync) */}
                    {attachments.length > 0 && (
                      <div className="space-y-3 pt-4 border-t">
                         <FormLabel>New Attachments</FormLabel>
                         <div className="space-y-2">
                           {attachments.map((att) => (
                             <div key={att.tempId} className="flex items-center gap-2 text-sm p-2 bg-slate-50 dark:bg-zinc-900 rounded-md border">
                               <Paperclip className="h-3.5 w-3.5 text-blue-500" />
                               <span className="truncate flex-1">{att.file.name}</span>
                               <button 
                                 type="button"
                                 onClick={() => handleRemoveAttachment(att.tempId)}
                                 className="text-slate-400 hover:text-red-500"
                               >
                                 <X className="h-3.5 w-3.5" />
                               </button>
                             </div>
                           ))}
                         </div>
                      </div>
                    )}

                    {/* MANUAL UPLOAD BUTTON */}
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
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

                    {/* ACTIONS */}
                    <div className="pt-4 flex items-center gap-2">
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={mutation.isPending || isUploading}
                      >
                        {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => navigate("/admin/content")}
                      >
                        Cancel
                      </Button>
                    </div>

                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </KnowledgeLayout>
  );
}