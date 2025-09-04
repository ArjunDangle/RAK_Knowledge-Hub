import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Building2, BookOpen, Wrench, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Group, Subsection } from "@/lib/types/content";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  title: string;
  description: string;
  group?: Group;
  subsection?: Subsection;
  articleCount?: number;
  updatedAt?: string;
  href: string;
  className?: string;
}

const groupIcons = {
  departments: Building2,
  'resource-centre': BookOpen,
  tools: Wrench,
};

export function CategoryCard({ title, description, group, articleCount, updatedAt, href, className }: CategoryCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const IconComponent = group ? groupIcons[group] : ChevronRight;

  return (
    <Card className={cn(
      "group flex flex-col transition-all duration-300 bg-card border border-border shadow-md hover:shadow-xl hover:border-primary hover:-translate-y-1",
      "cursor-pointer overflow-hidden",
      className
    )}>
      <Link to={href} className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-lg bg-primary text-primary-foreground">
              <IconComponent className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg text-card-foreground transition-colors group-hover:text-primary pt-1">{title}</h3>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary flex-shrink-0 mt-2" />
        </CardHeader>
        
        <CardContent className="flex-grow px-4 pb-4">
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </CardContent>

        <CardFooter className="flex items-center justify-between text-xs text-muted-foreground p-4 mt-auto bg-muted/50 border-t border-border">
          {articleCount !== undefined && (
            <span>{articleCount} {articleCount === 1 ? 'item' : 'items'}</span>
          )}
          {updatedAt && (
            <span>Updated {formatDate(updatedAt)}</span>
          )}
        </CardFooter>
      </Link>
    </Card>
  );
}