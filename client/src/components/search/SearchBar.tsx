import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SearchMode } from "@/lib/types/content";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  variant?: 'hero' | 'compact';
  defaultMode?: SearchMode;
  defaultQuery?: string;
  onSearch?: (query: string, mode: SearchMode) => void;
  className?: string;
}

const searchModes: { value: SearchMode; label: string; description: string }[] = [
  { value: 'all', label: 'All', description: 'Search everywhere' },
  { value: 'title', label: 'Title', description: 'Search in titles only' },
  { value: 'tags', label: 'Tags', description: 'Search in tags' },
  { value: 'content', label: 'Content', description: 'Search in content' },
];

export function SearchBar({ 
  variant = 'hero', 
  defaultMode = 'all', 
  defaultQuery = '',
  onSearch,
  className 
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultQuery);
  const [mode, setMode] = useState<SearchMode>(defaultMode);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    
    if (onSearch) {
      onSearch(trimmedQuery, mode);
    } else {
      // Navigate to search page
      const params = new URLSearchParams();
      if (trimmedQuery) params.append('q', trimmedQuery);
      params.append('mode', mode);
      navigate(`/search?${params.toString()}`);
    }
  };

  const selectedMode = searchModes.find(m => m.value === mode) || searchModes[0];

  return (
    <form 
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center",
        variant === 'hero' 
          ? "w-full max-w-2xl mx-auto bg-card rounded-xl border border-border shadow-lg"
          : "w-full max-w-md bg-card rounded-lg border border-border shadow-sm",
        className
      )}
    >
      {/* Mode Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "flex items-center gap-2 rounded-none border-0 border-r border-border hover:bg-muted/50",
              variant === 'hero' ? "h-14 px-4" : "h-10 px-3 text-sm"
            )}
          >
            <span className="text-muted-foreground font-medium">
              {selectedMode.label}
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-card/95 backdrop-blur border-border">
          {searchModes.map((searchMode) => (
            <DropdownMenuItem
              key={searchMode.value}
              onClick={() => setMode(searchMode.value)}
              className={cn(
                "flex flex-col items-start gap-1 py-3 cursor-pointer",
                mode === searchMode.value && "bg-primary/10 text-primary"
              )}
            >
              <span className="font-medium">{searchMode.label}</span>
              <span className="text-xs text-muted-foreground">
                {searchMode.description}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Search Input */}
      <div className="flex-1 relative">
        <Input
          type="search"
          placeholder="Search knowledge base..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0",
            variant === 'hero' 
              ? "h-14 px-4 text-base placeholder:text-muted-foreground" 
              : "h-10 px-3 placeholder:text-muted-foreground"
          )}
        />
      </div>

      {/* Search Button */}
      <Button
        type="submit"
        variant="ghost"
        className={cn(
          "rounded-none border-0 hover:bg-primary/10 hover:text-primary",
          variant === 'hero' ? "h-14 px-4" : "h-10 px-3"
        )}
      >
        <Search className={variant === 'hero' ? "h-5 w-5" : "h-4 w-4"} />
        <span className="sr-only">Search</span>
      </Button>
    </form>
  );
}