// client/src/pages/AdminGroupsPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { TreeSelect } from "@/components/cms/TreeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PlusCircle, Trash2, Edit, Loader2 } from "lucide-react";
import {
  getAllGroups,
  createGroup,
  deleteGroup,
  updateGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  getAllUsers,
  PermissionGroup,
  GroupUpdatePayload,
} from "@/lib/api/api-client";

// Helper component for the Edit/Manage Members Dialog
function ManageGroupDialog({ group, trigger }: { group: PermissionGroup; trigger: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(group.name);
  const [managedPageConfluenceId, setManagedPageConfluenceId] = useState<string | undefined>(group.managedPageConfluenceId || undefined);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(group.members.map(m => String(m.id)));

  const { data: allUsers } = useQuery({ queryKey: ['allUsers'], queryFn: getAllUsers });

  const userOptions: MultiSelectOption[] = allUsers
    ? allUsers
        .filter(user => user.role !== 'ADMIN')
        .map(u => ({ value: String(u.id), label: u.name }))
    : [];

  const updateMutation = useMutation({
    mutationFn: (payload: GroupUpdatePayload) => updateGroup(group.id, payload),
    onSuccess: () => {
      toast.success("Group details updated successfully.");
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
      setIsOpen(false); // Close dialog on successful save
    },
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });

  const memberMutation = useMutation({
    mutationFn: ({ userId, action }: { userId: number; action: 'add' | 'remove' }) => {
      return action === 'add' ? addMemberToGroup(group.id, userId) : removeMemberFromGroup(group.id, userId);
    },
    onSuccess: () => {
      toast.success("Members updated.");
      // THIS IS THE FIX (PART 1): We NO LONGER invalidate the query here, preventing the re-render.
    },
    onError: (e: Error) => toast.error("Failed to update members", { description: e.message }),
  });

  const handleSaveChanges = () => {
    if (!name.trim()) {
      toast.warning("Group name is required.");
      return;
    }
    updateMutation.mutate({ name: name.trim(), managedPageConfluenceId: managedPageConfluenceId || null });
  };
  
  const handleMemberChange = (newSelectedIds: string[]) => {
    const currentIds = new Set(selectedMembers);
    const newIds = new Set(newSelectedIds);
    
    const added = newSelectedIds.filter(id => !currentIds.has(id));
    const removed = selectedMembers.filter(id => !newIds.has(id));

    if (added.length > 0) memberMutation.mutate({ userId: parseInt(added[0]), action: 'add' });
    if (removed.length > 0) memberMutation.mutate({ userId: parseInt(removed[0]), action: 'remove' });

    setSelectedMembers(newSelectedIds);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // THIS IS THE FIX (PART 2): When the dialog closes, refresh the data in the main table.
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
    }
  };

  useEffect(() => {
    if (isOpen) {
      setName(group.name);
      setManagedPageConfluenceId(group.managedPageConfluenceId || undefined);
      setSelectedMembers(group.members.map(m => String(m.id)));
    }
  }, [isOpen, group]);
  
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Group: {group.name}</DialogTitle>
          {/* THIS IS THE FIX: Added more descriptive text */}
          <DialogDescription>
            Assign a root page to grant members edit access to that page and all of its children/descendant pages.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium">Group Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium">Managed Page (Permission Root)</label>
            <TreeSelect value={managedPageConfluenceId} onChange={setManagedPageConfluenceId} />
          </div>
          <div>
            <label className="text-sm font-medium">Members</label>
            <MultiSelect options={userOptions} selected={selectedMembers} onChange={handleMemberChange} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
          <Button onClick={handleSaveChanges} disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component
export default function AdminGroupsPage() {
  const queryClient = useQueryClient();
  const [newGroupName, setNewGroupName] = useState("");

  const { data: groups, isLoading } = useQuery({
    queryKey: ['allGroups'],
    queryFn: getAllGroups,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createGroup(name),
    onSuccess: (data) => {
      toast.success(`Group "${data.name}" created.`);
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
      setNewGroupName("");
    },
    onError: (e: Error) => toast.error("Failed to create group", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId: number) => deleteGroup(groupId),
    onSuccess: () => {
      toast.success("Group deleted.");
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
    },
    onError: (e: Error) => toast.error("Failed to delete group", { description: e.message }),
  });

  const handleCreateGroup = () => {
    if (newGroupName.trim()) {
      createMutation.mutate(newGroupName.trim());
    } else {
      toast.warning("Please enter a name for the group.");
    }
  };
  
  const breadcrumbs = [{ label: "Admin" }, { label: "Group Permissions" }];

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Group Permissions</h1>
          <p className="text-muted-foreground">
            Create groups and assign them to a page category to grant edit permissions to all nested content.
          </p>
        </div>

        <div className="mb-6 flex gap-2">
          <Input 
            placeholder="New group name..." 
            value={newGroupName} 
            onChange={(e) => setNewGroupName(e.target.value)}
            className="max-w-xs"
          />
          <Button onClick={handleCreateGroup} disabled={createMutation.isPending}>
            {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            Create Group
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group Name</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 inline-block" /></TableCell>
                  </TableRow>
                ))
              ) : groups && groups.length > 0 ? (
                groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell className="font-medium">{group.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {group.members.map(member => (
                          <Badge key={member.id} variant="secondary">{member.name}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <ManageGroupDialog 
                        group={group} 
                        trigger={<Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" />Manage</Button>} 
                      />
                      <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(group.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">No groups created yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </KnowledgeLayout>
  );
}