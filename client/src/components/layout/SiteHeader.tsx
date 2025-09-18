import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

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
        {/* ===== FIX IS HERE ===== */}
        {/* The `md:hidden` class is removed to show the toggle on desktop */}
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
        
        {/* Logo */}
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

        {/* Navigation & Search */}
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center"></nav>

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
        </div>
      </div>
    </header>
  );
}