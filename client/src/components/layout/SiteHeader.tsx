// client/src/components/layout/SiteHeader.tsx
import { Search, Menu, PlusCircle, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

interface SiteHeaderProps {
  showSidebarToggle?: boolean;
  onSidebarToggle?: () => void;
  logoSrc?: string;
}

export function SiteHeader({ 
  showSidebarToggle = false, 
  onSidebarToggle, 
  logoSrc 
}: SiteHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isAdmin } = useAuth(); // Get isAdmin from context

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "shadow-sm"
    )}>
      <div className="container max-w-7xl mx-auto flex h-16 items-center gap-4 px-6">
        {showSidebarToggle && onSidebarToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="h-9 w-9 p-0"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}
        
        <div className="flex items-center space-x-2 mr-auto">
           <Link to="/" className="flex items-center space-x-3">
            {logoSrc ? (
              <img src={logoSrc} alt="RAKwireless Logo" className="h-10 w-auto" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                <span className="text-secondary-foreground font-bold text-sm">R</span>
              </div>
            )}
            
            <div className="hidden sm:block">
              <div className="font-semibold text-foreground">RAKwireless</div>
              <div className="text-xs text-muted-foreground -mt-1">Knowledge Hub</div>
            </div>
           </Link>
        </div>

        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="hidden md:flex items-center rounded-full bg-muted/60 px-3 h-9">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-2 w-52 h-full bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </form>
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link to="/search">
             <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>

          <div className="h-6 w-px bg-border hidden md:block" />
          
          {/* --- NEW CMS & ADMIN BUTTONS --- */}
          {isAuthenticated && (
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                    <Link to="/create">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Content
                    </Link>
                </Button>
                {isAdmin && (
                     <Button variant="ghost" size="sm" asChild>
                        <Link to="/admin/dashboard">
                            <LayoutDashboard className="h-4 w-4 mr-2" />
                            Admin
                        </Link>
                    </Button>
                )}
            </div>
          )}
          {/* ----------------------------- */}

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                {user?.username}
              </span>
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
               </Button>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">Sign In</Link>
            </Button>
          )}
        </div>
       </div>
    </header>
  );
}