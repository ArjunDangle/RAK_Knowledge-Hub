// client/src/pages/LoginPage.tsx
import { useState, useEffect } from "react"; // 1. ADD useEffect TO IMPORTS
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner"; // 2. IMPORT toast FROM SONNER

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { PasswordInput } from "@/components/ui/PasswordInput";

import { useAuth } from "@/context/AuthContext";
import { loginUser, LoginResponse, LoginCredentials } from "@/lib/api/api-client";

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  // 3. ADD THIS useEffect HOOK
  useEffect(() => {
    // Check for a logout message when the component first loads
    const logoutMessage = localStorage.getItem('logoutMessage');
    
    if (logoutMessage) {
      // If a message exists, show it as a toast
      toast.info("Session Expired", {
        description: logoutMessage,
        duration: 5000, // Show for 5 seconds
      });
      // IMPORTANT: Remove the message from storage so it doesn't show again
      localStorage.removeItem('logoutMessage');
    }
  }, []); // The empty dependency array ensures this runs only once when the page loads

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const mutation = useMutation<LoginResponse, Error, LoginCredentials>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      login(data);
      navigate("/");
    },
    onError: (error) => {
      setApiError(error.message || "An unknown error occurred.");
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setApiError(null);
    mutation.mutate(data as LoginCredentials);
  };

  return (
    <div className="flex flex-col min-h-screen bg-muted/40">
      <SiteHeader logoSrc="/rak-logo.png" />
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {apiError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{apiError}</AlertDescription>
              </Alert>
            )}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <PasswordInput placeholder="Enter your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-center text-muted-foreground w-full">
              Need access? Please contact your administrator.
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}