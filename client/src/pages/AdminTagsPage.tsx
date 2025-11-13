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
  createTag,
  deleteTag,
} from "@/lib/api/api-client";

// Helper function to re-fetch data after a mutation
const invalidateQueries = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["allTagsGroupedAdmin"] });
};

// Dialog for adding a new tag to a group
function AddTagDialog({
  groupId,
  groupName,
}: {
  groupId: number;
  groupName: string;
}) {
  const [tagName, setTagName] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createTag({ name: tagName, tagGroupId: groupId }),
    onSuccess: () => {
      toast.success(`Tag "${tagName}" added to group "${groupName}".`);
      invalidateQueries(queryClient);
      setTagName(""); // Clear input for next addition
    },
    onError: (e: Error) =>
      toast.error("Failed to add tag", { description: e.message }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagName.trim()) {
      mutation.mutate();
    }
  };

  return (
    <Dialog onOpenChange={() => setTagName("")}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs">
          <PlusCircle className="h-3 w-3 mr-1" /> Add Tag
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Tag to "{groupName}"</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <Input
            placeholder="New tag name..."
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
            autoFocus
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Done
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={mutation.isPending || !tagName.trim()}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add & Continue
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component
export default function AdminTagsPage() {
  const queryClient = useQueryClient();
  const [newGroupName, setNewGroupName] = useState("");

  const { data: groups, isLoading } = useQuery({
    queryKey: ["allTagsGroupedAdmin"],
    queryFn: getAllTagGroupsWithTagsAdmin, // This is the corrected query function
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
                      <AddTagDialog groupId={group.id} groupName={group.name} />
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
