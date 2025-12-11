import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
} from "@tanstack/react-query";
import { PlusCircle, Trash2, Loader2, GripVertical, X } from "lucide-react";
import { toast } from "sonner";

import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Import Textarea
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  getAllTagGroupsWithTagsAdmin,
  createTagGroup,
  deleteTagGroup,
  createTagsInBulk, // Use the new bulk creation function
  deleteTag,
} from "@/lib/api/api-client";

const invalidateQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["allTagsGroupedAdmin"] });
};

// --- MODIFIED COMPONENT: AddTagDialog becomes ManageTagsDialog ---
function ManageTagsDialog({
  groupId,
  groupName,
}: {
  groupId: number;
  groupName: string;
}) {
  const [tagInput, setTagInput] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (tagNames: string[]) => createTagsInBulk({ names: tagNames, tagGroupId: groupId }),
    onSuccess: (data) => {
      toast.success(data.message || "Tags added successfully.");
      invalidateQueries(queryClient);
      setTagInput(""); // Clear textarea for next batch
    },
    onError: (e: Error) =>
      toast.error("Failed to add tags", { description: e.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagNames = tagInput.split(',').map(tag => tag.trim()).filter(Boolean);
    if (tagNames.length > 0) {
      mutation.mutate(tagNames);
    }
  };

  return (
    <Dialog onOpenChange={() => setTagInput("")}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <PlusCircle className="h-3 w-3 mr-1" /> Add Tag(s)
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tags to "{groupName}"</DialogTitle>
          <DialogDescription>
            Enter a single tag name, or paste a comma-separated list of tags to add them in bulk.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Textarea
            placeholder="e.g., WisGate OS, WisDM, RAKPiOS..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            autoFocus
            rows={5}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Done
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending || !tagInput.trim()}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Tags
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component (mostly unchanged, just uses the new dialog)
export default function AdminTagsPage() {
  const queryClient = useQueryClient();
  const [newGroupName, setNewGroupName] = useState("");

  const { data: groups, isLoading } = useQuery({
    queryKey: ["allTagsGroupedAdmin"],
    queryFn: getAllTagGroupsWithTagsAdmin,
  });

  const createGroupMutation = useMutation({
    mutationFn: () => createTagGroup({ name: newGroupName }),
    onSuccess: () => {
      toast.success(`Tag group "${newGroupName}" created.`);
      invalidateQueries(queryClient);
      setNewGroupName("");
    },
    onError: (e: Error) =>
      toast.error("Failed to create group", { description: e.message }),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: number) => deleteTagGroup(groupId),
    onSuccess: () => {
      toast.success("Tag group deleted.");
      invalidateQueries(queryClient);
    },
    onError: (e: Error) =>
      toast.error("Failed to delete group", { description: e.message }),
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: number) => deleteTag(tagId),
    onSuccess: () => {
      toast.success("Tag deleted.");
      invalidateQueries(queryClient);
    },
    onError: (e: Error) =>
      toast.error("Failed to delete tag", { description: e.message }),
  });

  const breadcrumbs = [{ label: "Admin" }, { label: "Tag Management" }];

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tag Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage the structured tags that content creators will use
            to categorize articles. All groups are mandatory for new content.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Tag Group</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              placeholder="e.g., 'Product Line', 'Content Type'..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <Button
              onClick={() => createGroupMutation.mutate()}
              disabled={createGroupMutation.isPending || !newGroupName.trim()}
            >
              {createGroupMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlusCircle className="mr-2 h-4 w-4" />
              )}
              Create Group
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            groups?.map((group) => (
              <Card key={group.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>
                        {group.description ||
                          "This is a mandatory category for all new articles."}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {group.name !== "legacy" && (
                      <ManageTagsDialog groupId={group.id} groupName={group.name} />
                    )}
                    {group.name !== "legacy" && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteGroupMutation.mutate(group.id)}
                        disabled={deleteGroupMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 p-4 rounded-md border bg-muted/50 min-h-[60px] items-center">
                    {group.tags.length > 0 ? (
                      group.tags.map((tag) => (
                        <Badge
                          key={tag.id}
                          variant="secondary"
                          className="group/badge text-sm py-1 px-3"
                        >
                          {tag.name}
                          <button
                            onClick={() => deleteTagMutation.mutate(tag.id)}
                            className="ml-2 opacity-0 group-hover/badge:opacity-100 transition-opacity disabled:opacity-50"
                            disabled={deleteTagMutation.isPending}
                          >
                            <X className="h-3 w-3 rounded-full hover:bg-destructive hover:text-destructive-foreground" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground px-2">
                        No tags in this group yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </KnowledgeLayout>
  );
}