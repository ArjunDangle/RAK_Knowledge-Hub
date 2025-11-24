import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { KnowledgeLayout } from "./KnowledgeLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerUserByAdmin, UserCreatePayload, User } from "@/lib/api/api-client";

// --- 1. IMPORT THE NEW COMPONENT ---
import { PasswordInput } from "@/components/ui/PasswordInput";

const registerSchema = z.object({
  name: z.string().min(2, { message: "Full name is required." }),
  username: z.string().min(3, { message: "Username must be at least 3 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  role: z.enum(["ADMIN", "MEMBER"], { required_error: "You must select a role." }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function AdminRegisterPage() {
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      username: "",
      password: "",
      role: "MEMBER",
    },
  });

  const mutation = useMutation<User, Error, UserCreatePayload>({
    mutationFn: registerUserByAdmin,
    onSuccess: (data) => {
      toast.success("User Created Successfully", {
        description: `User "${data.name}" has been registered with the role ${data.role}.`,
      });
      form.reset();
    },
    onError: (error) => {
      toast.error("Registration Failed", { description: error.message });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    mutation.mutate(data as UserCreatePayload);
  };

  const breadcrumbs = [{ label: "Admin" }, { label: "Register New User" }];

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Register a New User</CardTitle>
            <CardDescription>
              Create a new account and assign a role. The user will be able to sign in with these credentials immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Name and Username fields remain unchanged */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl><Input placeholder="e.g., john.doe@rakwireless.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* --- 2. MODIFY THE PASSWORD FIELD --- */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        {/* Replace the old Input with the new PasswordInput */}
                        <PasswordInput placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role field and Button remain unchanged */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="MEMBER">Member</SelectItem>
                          <SelectItem value="ADMIN">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </KnowledgeLayout>
  );
}