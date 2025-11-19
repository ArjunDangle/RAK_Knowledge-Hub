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
import { PlusCircle, Trash2, Edit, Loader2, Crown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  getAllGroups,
  createGroup,
  deleteGroup,
  updateGroup,
  removeMemberFromGroup,
  updateMemberRole, // New function for role changes
  getAllUsers,
  PermissionGroup,
  GroupUpdatePayload,
} from "@/lib/api/api-client";

// The dialog component is now heavily modified
function ManageGroupDialog({ group, trigger }: { group: PermissionGroup; trigger: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  
  // State for the main group details
  const [name, setName] = useState(group.name);
  const [managedPageConfluenceId, setManagedPageConfluenceId] = useState<string | undefined>(group.managedPageConfluenceId || undefined);
  
  // State for adding new members
  const [newMembers, setNewMembers] = useState<string[]>([]);
  
  const { data: allUsers } = useQuery({ queryKey: ['allUsers'], queryFn: getAllUsers });

  // Filter out users who are already in the group from the "Add Member" dropdown
  const userOptions: MultiSelectOption[] = allUsers
    ? allUsers
        .filter(user => user.role !== 'ADMIN' && !group.memberships.some(m => m.user.id === user.id))
        .map(u => ({ value: String(u.id), label: u.name }))
    : [];
    
  // Mutation for updating group name/managed page
  const updateGroupMutation = useMutation({
    mutationFn: (payload: GroupUpdatePayload) => updateGroup(group.id, payload),
    onSuccess: () => {
      toast.success("Group details updated successfully.");
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
    },
    onError: (e: Error) => toast.error("Update failed", { description: e.message }),
  });
  
  // Mutation for changing a member's role
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: "MEMBER" | "GROUP_ADMIN" }) => updateMemberRole(group.id, userId, role),
    onSuccess: () => {
      toast.success("Member role updated.");
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
    },
    onError: (e: Error) => toast.error("Failed to update role", { description: e.message }),
  });

  // Mutation for removing a member
  const removeMutation = useMutation({
    mutationFn: (userId: number) => removeMemberFromGroup(group.id, userId),
    onSuccess: () => {
      toast.success("Member removed from group.");
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
    },
    onError: (e: Error) => toast.error("Failed to remove member", { description: e.message }),
  });

  // Mutation for adding new members
  const addMutation = useMutation({
      mutationFn: (userId: number) => updateMemberRole(group.id, userId, "MEMBER"), // Add as MEMBER by default
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['allGroups'] });
      },
      onError: (e: Error) => toast.error("Failed to add member", { description: e.message }),
  });

  const handleAddMembers = async () => {
      if (newMembers.length === 0) return;
      toast.info(`Adding ${newMembers.length} new member(s)...`);
      await Promise.all(newMembers.map(userId => addMutation.mutateAsync(parseInt(userId))));
      toast.success("New members added successfully.");
      setNewMembers([]); // Reset the selection
  };
  
  const handleSaveChanges = () => {
    if (!name.trim()) {
      toast.warning("Group name is required.");
      return;
    }
    updateGroupMutation.mutate({ name: name.trim(), managedPageConfluenceId: managedPageConfluenceId || null });
  };
  
  useEffect(() => {
    if (isOpen) {
      setName(group.name);
      setManagedPageConfluenceId(group.managedPageConfluenceId || undefined);
      setNewMembers([]);
    }
  }, [isOpen, group]);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Group: {group.name}</DialogTitle>
          <DialogDescription>
            Assign a root page to grant permissions, and manage member roles within this group.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Section for Group Name and Managed Page */}
          <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold text-foreground">Group Details</h4>
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Managed Page (Permission Root)</label>
                <TreeSelect value={managedPageConfluenceId} onChange={setManagedPageConfluenceId} />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveChanges} disabled={updateGroupMutation.isPending} size="sm">
                    {updateGroupMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Details
                </Button>
              </div>
          </div>

          {/* Section for Managing Existing Members */}
          <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold text-foreground">Manage Members ({group.memberships.length})</h4>
              <div className="space-y-2">
                {group.memberships.map(membership => (
                  <div key={membership.userId} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                    <span className="font-medium">{membership.user.name}</span>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={membership.role}
                        onValueChange={(role: "MEMBER" | "GROUP_ADMIN") => roleMutation.mutate({ userId: membership.userId, role })}
                      >
                        <SelectTrigger className="w-[160px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="GROUP_ADMIN">Group Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeMutation.mutate(membership.userId)}>
                          <Trash2 className="h-4 w-4"/>
                      </Button>
                    </div>
                  </div>
                ))}
                {group.memberships.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No members in this group yet.</p>}
              </div>
          </div>

          {/* Section for Adding New Members */}
          <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="font-semibold text-foreground">Add New Members</h4>
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                    <label className="text-sm font-medium">Select users to add</label>
                    <MultiSelect options={userOptions} selected={newMembers} onChange={setNewMembers} placeholder="Select users..." />
                </div>
                <Button onClick={handleAddMembers} disabled={addMutation.isPending || newMembers.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
              </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Close</Button></DialogClose>
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
            Create groups, assign members and Group Admins, and grant editing rights to specific content sections.
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
                        {group.memberships.length > 0 ? group.memberships.map(membership => (
                          <Badge key={membership.userId} variant={membership.role === 'GROUP_ADMIN' ? 'default' : 'secondary'}>
                            {membership.role === 'GROUP_ADMIN' && <Crown className="h-3 w-3 mr-1.5" />}
                            {membership.user.name}
                          </Badge>
                        )) : <span className="text-xs text-muted-foreground">No members</span>}
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