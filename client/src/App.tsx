// client/src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Landing from "./pages/Landing";
import CategoryPage from "./pages/CategoryPage";
import ArticlePage from "./pages/ArticlePage";
import SearchPage from "./pages/SearchPage";
import WhatsNewPage from "./pages/WhatsNewPage";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import CreatePage from "./pages/CreatePage";
import EditPage from "./pages/EditPage";
import AdminDashboard from "./pages/AdminDashboard";
import MySubmissionsPage from "./pages/MySubmissionsPage";
import AdminIndexPage from "./pages/AdminIndexPage";
import AdminEditPage from "./pages/AdminEditPage";
import AdminGroupsPage from "./pages/AdminGroupsPage";
import MyGroupsPage from "./pages/MyGroupsPage";
import AdminTagsPage from "./pages/AdminTagsPage";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const LoadingSpinner = () => (
    <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) {
        return <LoadingSpinner />;
    }
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminRoute = () => {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();
    if (isLoading) {
        return <LoadingSpinner />;
    }
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        {/* --- THIS IS THE FIX --- */}
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/category/:group" element={<CategoryPage />} />
            <Route path="/page/:pageId" element={<CategoryPage />} />
            <Route path="/article/:pageId" element={<ArticlePage />} />
            <Route path="/whats-new" element={<WhatsNewPage />} />
            
            {/* Protected Routes for Logged-in Users */}
            <Route element={<ProtectedRoute />}>
              <Route path="/create" element={<CreatePage />} />
              <Route path="/my-submissions" element={<MySubmissionsPage />} />
              <Route path="/my-groups" element={<MyGroupsPage />} /> 
              <Route path="/edit/:pageId" element={<EditPage />} /> {/* <-- STEP 2.1: ROUTE ADDED */}
            </Route>

            {/* Protected Routes for Admins */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/content-index" element={<AdminIndexPage />} />
              <Route path="/admin/edit/:pageId" element={<AdminEditPage />} />
              <Route path="/admin/groups" element={<AdminGroupsPage />} />
              <Route path="/admin/tags" element={<AdminTagsPage />} />
            </Route>

            {/* Not Found Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;