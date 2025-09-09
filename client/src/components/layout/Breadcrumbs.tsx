import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)} aria-label="Breadcrumb">
      <Link
        to="/"
        className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
      >
        <Home className="h-4 w-4" />
        <span className="sr-only">Home</span>
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          {item.href && index < items.length - 1 ? (
            <Link
              to={item.href}
              title={item.label}
              className="block max-w-40 truncate text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ) : (
            <span
              title={item.label}
              className={cn(
                "block max-w-40 truncate",
                index === items.length - 1 
                  ? "text-foreground font-medium" 
                  : "text-muted-foreground"
              )}
            >
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}