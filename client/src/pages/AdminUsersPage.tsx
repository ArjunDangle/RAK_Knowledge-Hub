import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { 
  getAdminUsers, 
  deleteUser, 
  updateUserRole, 
  adminResetPassword,
  User 
} from "@/lib/api/api-client";
import { useAuth } from "@/context/AuthContext";
import { formatShortDate } from "@/lib/utils/date";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { toast } from "sonner";
import { MoreVertical, Shield, ShieldAlert, Trash2, KeyRound, User as UserIcon, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToReset, setUserToReset] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: getAdminUsers,
  });

  // --- Mutations ---

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("User deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setUserToDelete(null);
    },
    onError: (error: Error) => toast.error("Delete failed", { description: error.message }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number, role: "ADMIN" | "MEMBER" }) => 
      updateUserRole(id, role),
    onSuccess: (data) => {
      toast.success(`Role updated to ${data.role}`);
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (error: Error) => toast.error("Update failed", { description: error.message }),
  });

  const resetPassMutation = useMutation({
    mutationFn: () => adminResetPassword(userToReset!.id, newPassword),
    onSuccess: () => {
      toast.success("Password reset successfully.");
      setUserToReset(null);
      setNewPassword("");
    },
    onError: (error: Error) => toast.error("Reset failed", { description: error.message }),
  });

  // --- Filtering ---

  const filteredUsers = users?.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KnowledgeLayout breadcrumbs={[{ label: "Admin" }, { label: "User Management" }]}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
            <p className="text-muted-foreground">Manage user access, roles, and security settings.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search users..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="border rounded-lg bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username / Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 inline-block" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {u.name.charAt(0).toUpperCase()}
                    </div>
                    {u.name}
                    {currentUser?.id === u.id && <Badge variant="secondary" className="ml-2 text-[10px]">YOU</Badge>}
                  </TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "default" : "outline"}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                        {u.groupMemberships && u.groupMemberships.length > 0 ? (
                            u.groupMemberships.map(m => (
                                <Badge key={m.groupId} variant="secondary" className="text-[10px]">
                                    {m.group.name} {m.role === 'ADMIN' && '★'}
                                </Badge>
                            ))
                        ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                        )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => roleMutation.mutate({ 
                            id: u.id, 
                            role: u.role === "ADMIN" ? "MEMBER" : "ADMIN" 
                        })} disabled={currentUser?.id === u.id}>
                          {u.role === "ADMIN" ? (
                            <><UserIcon className="mr-2 h-4 w-4" /> Demote to Member</>
                          ) : (
                            <><Shield className="mr-2 h-4 w-4" /> Promote to Admin</>
                          )}
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem onClick={() => setUserToReset(u)}>
                            <KeyRound className="mr-2 h-4 w-4" /> Reset Password
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => setUserToDelete(u)}
                            disabled={currentUser?.id === u.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(o) => !o && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>? 
              This action cannot be undone. If they have active submissions or notifications, deletion might fail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={() => userToDelete && deleteMutation.mutate(userToDelete.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!userToReset} onOpenChange={(o) => !o && setUserToReset(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogDescription>
                    Set a new temporary password for <strong>{userToReset?.name}</strong>.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <PasswordInput 
                    placeholder="New password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setUserToReset(null)}>Cancel</Button>
                <Button 
                    onClick={() => resetPassMutation.mutate()} 
                    disabled={newPassword.length < 6 || resetPassMutation.isPending}
                >
                    Update Password
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </KnowledgeLayout>
  );
}