import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  href: string; // This will now be an ID-based URL
  className?: string;
}

const groupIcons = {
  departments: Building2,
  'resource-centre': BookOpen,
  tools: Wrench
};

export function CategoryCard({ title, description, group, subsection, articleCount, updatedAt, href, className }: CategoryCardProps) {
  const IconComponent = group ? groupIcons[group] : ChevronRight;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-md hover:-translate-y-1 border-border bg-card",
      "hover:border-primary/20 cursor-pointer",
      className
    )}>
      {/* --- LINK NOW USES THE ID-BASED HREF PROP --- */}
      <Link to={href} className="block h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                <IconComponent className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">{title}</h3>
                {subsection && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {subsection.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs px-2 py-0">{tag.name}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">{description}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            {articleCount !== undefined && (<span>{articleCount} {articleCount === 1 ? 'item' : 'items'}</span>)}
            {updatedAt && (<span>Updated {formatDate(updatedAt)}</span>)}
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}