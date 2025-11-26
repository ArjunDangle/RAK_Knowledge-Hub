// client/src/pages/AdminGroupsPage.tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription, DialogClose } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MultiSelect, MultiSelectOption } from "@/components/ui/multi-select";
import { TreeSelect } from "@/components/cms/TreeSelect";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PlusCircle, Trash2, Edit, Loader2, Shield, User } from "lucide-react";
import {
  getAllGroups,
  createGroup,
  deleteGroup,
  updateGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  updateGroupMemberRole,
  getAllUsers,
  PermissionGroup,
  GroupUpdatePayload,
  User as ApiUser
} from "@/lib/api/api-client";

// Helper component for the Edit/Manage Members Dialog
function ManageGroupDialog({ group, trigger }: { group: PermissionGroup; trigger: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(group.name);
  const [managedPageConfluenceId, setManagedPageConfluenceId] = useState<string | undefined>(group.managedPageConfluenceId || undefined);
  
  // Users not yet in the group (for the Add dropdown)
  const existingMemberIds = new Set(group.members.map(m => m.id));
  const { data: allUsers } = useQuery({ queryKey: ['allUsers'], queryFn: getAllUsers });
  
  const userOptions: MultiSelectOption[] = allUsers
    ? allUsers
        .filter(user => !existingMemberIds.has(user.id) && user.role !== 'ADMIN')
        .map(u => ({ value: String(u.id), label: u.name }))
    : [];

  // State for the "Add New" dropdown
  const [usersToAdd, setUsersToAdd] = useState<string[]>([]);

  const updateMutation = useMutation({
    mutationFn: (payload: GroupUpdatePayload) => updateGroup(group.id, payload),
    onSuccess: () => {
      toast.success("Group details updated.");
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId: number) => addMemberToGroup(group.id, userId),
    onSuccess: () => {
        toast.success("Member added.");
        setUsersToAdd([]); // Clear selection
        queryClient.invalidateQueries({ queryKey: ['allGroups'] });
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeMemberFromGroup(group.id, userId),
    onSuccess: () => {
        toast.success("Member removed.");
        queryClient.invalidateQueries({ queryKey: ['allGroups'] });
    }
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: number, role: "ADMIN" | "MEMBER" }) => 
        updateGroupMemberRole(group.id, userId, role),
    onSuccess: () => {
        toast.success("Role updated.");
        queryClient.invalidateQueries({ queryKey: ['allGroups'] });
    },
    onError: () => toast.error("Failed to update role.")
  });

  const handleSaveChanges = () => {
    if (!name.trim()) return;
    updateMutation.mutate({ name: name.trim(), managedPageConfluenceId: managedPageConfluenceId || null });
    setIsOpen(false);
  };

  const handleAddUsers = () => {
      usersToAdd.forEach(id => addMemberMutation.mutate(Number(id)));
  };

  // We need to access the 'memberships' to get the role, but 'group.members' is just a list of Users.
  // We need to find the specific membership entry for this group from the user's data.
  // UPDATED: Uses ApiUser type to fix 'any' errors
  const getMemberRole = (user: ApiUser) => {
      const membership = user.groupMemberships?.find((m) => m.groupId === group.id);
      return membership?.role || "MEMBER";
  };

  useEffect(() => {
    if (isOpen) {
      setName(group.name);
      setManagedPageConfluenceId(group.managedPageConfluenceId || undefined);
      setUsersToAdd([]);
    }
  }, [isOpen, group]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Group: {group.name}</DialogTitle>
          <DialogDescription>
            Configure settings and manage member roles for this group.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* General Settings */}
          <div className="space-y-3 p-4 border rounded-md bg-muted/20">
            <h3 className="font-semibold text-sm">General Settings</h3>
            <div className="grid gap-2">
                <label className="text-xs font-medium">Group Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <label className="text-xs font-medium">Managed Page (Permission Root)</label>
                <TreeSelect value={managedPageConfluenceId} onChange={setManagedPageConfluenceId} />
            </div>
            <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveChanges} disabled={updateMutation.isPending}>Save Settings</Button>
            </div>
          </div>

          {/* Member Management */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Membership</h3>
            
            {/* Add New */}
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-xs font-medium mb-1 block">Add New Members</label>
                    <MultiSelect 
                        options={userOptions} 
                        selected={usersToAdd} 
                        onChange={setUsersToAdd} 
                        placeholder="Select users to add..."
                    />
                </div>
                <Button size="sm" onClick={handleAddUsers} disabled={usersToAdd.length === 0}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                </Button>
            </div>

            {/* Current Members List */}
            <div className="border rounded-md mt-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {group.members.length === 0 ? (
                            <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No members yet.</TableCell></TableRow>
                        ) : (
                            group.members.map(member => {
                                const role = getMemberRole(member);
                                return (
                                    <TableRow key={member.id}>
                                        <TableCell>{member.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={role === 'ADMIN' ? 'default' : 'secondary'}>
                                                {role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {role === 'MEMBER' ? (
                                                <Button variant="ghost" size="sm" onClick={() => roleMutation.mutate({ userId: member.id, role: 'ADMIN' })}>
                                                    <Shield className="h-3 w-3 mr-1" /> Promote
                                                </Button>
                                            ) : (
                                                <Button variant="ghost" size="sm" onClick={() => roleMutation.mutate({ userId: member.id, role: 'MEMBER' })}>
                                                    <User className="h-3 w-3 mr-1" /> Demote
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => removeMemberMutation.mutate(member.id)}>
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
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

// New Component for creating groups via a Dialog
function CreateGroupDialog({ onCreate, isPending }: { onCreate: (name: string) => void, isPending: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate(name.trim());
      setIsOpen(false);
      setName("");
    } else {
      toast.warning("Please enter a name for the group.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* Modified button: Standard size, margin top to sit below table */}
        <Button className="mt-4">
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Group</DialogTitle>
          <DialogDescription>
            Enter a unique name for the new permission group.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Group Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Page Component
export default function AdminGroupsPage() {
  const queryClient = useQueryClient();
  const [groupToDelete, setGroupToDelete] = useState<PermissionGroup | null>(null);

  const { data: groups, isLoading } = useQuery({
    queryKey: ['allGroups'],
    queryFn: getAllGroups,
  });

  const createMutation = useMutation({
    mutationFn: (name: string) => createGroup(name),
    onSuccess: (data) => {
      toast.success(`Group "${data.name}" created.`);
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
    },
    onError: (e: Error) => toast.error("Failed to create group", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (groupId: number) => deleteGroup(groupId),
    onSuccess: () => {
      toast.success("Group deleted.");
      queryClient.invalidateQueries({ queryKey: ['allGroups'] });
      setGroupToDelete(null);
    },
    onError: (e: Error) => toast.error("Failed to delete group", { description: e.message }),
  });
  
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
                        {group.members.map(member => {
                          const isGroupAdmin = member.groupMemberships?.some(
                            m => m.groupId === group.id && m.role === 'ADMIN'
                          );
                          
                          return (
                            <Badge 
                              key={member.id} 
                              variant={isGroupAdmin ? "default" : "secondary"}
                            >
                              {member.name}
                              {isGroupAdmin && <Shield className="ml-1 h-3 w-3" />}
                            </Badge>
                          );
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <ManageGroupDialog 
                        group={group} 
                        trigger={<Button variant="outline" size="sm"><Edit className="h-4 w-4 mr-2" />Manage</Button>} 
                      />
                      <Button variant="destructive" size="sm" onClick={() => setGroupToDelete(group)} disabled={deleteMutation.isPending}>
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

        {/* Create Group Dialog - Placed here to be at the end of the table flow */}
        <CreateGroupDialog onCreate={(name) => createMutation.mutate(name)} isPending={createMutation.isPending} />
      </div>

      <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the group <strong>"{groupToDelete?.name}"</strong>. 
              All members will lose the permissions associated with this group.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => groupToDelete && deleteMutation.mutate(groupToDelete.id)}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Group"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KnowledgeLayout>
  );
}