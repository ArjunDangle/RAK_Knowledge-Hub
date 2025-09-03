import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SiteHeaderProps {
  showSidebarToggle?: boolean;
  onSidebarToggle?: () => void;
  variant?: 'landing' | 'knowledge';
}

export function SiteHeader({ showSidebarToggle = false, onSidebarToggle, variant = 'landing' }: SiteHeaderProps) {
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
      "border-b border-border"
    )}>
      <div className={cn(
        "flex h-16 items-center gap-4",
        variant === 'landing' ? "container max-w-7xl mx-auto px-6" : "px-6"
      )}>
        {/* Sidebar Toggle (Knowledge Layout) */}
        {showSidebarToggle && onSidebarToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="h-9 w-9 p-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        )}
        
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-semibold text-foreground">RAKwireless</div>
              <div className="text-xs text-muted-foreground -mt-1">Knowledge Hub</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex items-center space-x-6 text-sm font-medium ml-auto">
          <Link
            to="/whats-new"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            What's New
          </Link>
        </nav>

        {/* Search (compact for knowledge layout) */}
        {variant === 'knowledge' && (
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 h-9"
              />
            </div>
          </form>
        )}

        {/* Search Icon (landing layout) */}
        {variant === 'landing' && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/search">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}