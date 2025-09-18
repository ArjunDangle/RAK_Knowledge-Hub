import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Building2,
  BookOpen,
  Wrench,
  ChevronRight,
  Eye,
  FileText,
  Folder,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Group, Subsection } from "@/lib/types/content";
import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { getPageContents } from "@/lib/api/api-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  "resource-centre": BookOpen,
  tools: Wrench,
};

function CategoryPreviewContent({ subsectionId }: { subsectionId: string }) {
  const { data: children, isLoading } = useQuery({
    queryKey: ["preview-children", subsectionId],
    queryFn: () => getPageContents(subsectionId),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="p-2 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-5 w-2/3" />
      </div>
    );
  }

  if (!children || children.length === 0) {
    return <p className="p-4 text-sm text-center text-muted-foreground">This section is empty.</p>;
  }

  return (
    <ScrollArea className="h-auto max-h-64">
      <div className="p-2 space-y-1">
        {children.map((child) => {
          const isArticle = child.type === 'article';
          const Icon = isArticle ? FileText : Folder;
          const linkTo = isArticle ? `/article/${child.id}` : `/page/${child.id}`;

          return (
            <Link
              key={child.id}
              to={linkTo}
              className="flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-accent"
            >
              <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium text-foreground truncate">{child.title}</span>
            </Link>
          );
        })}
      </div>
    </ScrollArea>
  );
}

export function CategoryCard({
  title,
  description,
  group,
  subsection,
  articleCount,
  updatedAt,
  href,
  className,
}: CategoryCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const IconComponent = group ? groupIcons[group] : ChevronRight;

  return (
    <Card
      className={cn(
        // ===== THE FIX IS HERE: `hover:-translate-y-1` has been removed =====
        "group flex flex-col transition-all duration-300 bg-card border border-border shadow-md hover:shadow-xl hover:border-primary",
        "overflow-hidden",
        className
      )}
    >
      <Link to={href} className="flex flex-col h-full">
        <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 p-3 rounded-lg bg-primary text-primary-foreground">
              <IconComponent className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-lg text-card-foreground transition-colors group-hover:text-primary pt-1">
              {title}
            </h3>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary flex-shrink-0 mt-2" />
        </CardHeader>
        <CardContent className="flex-grow px-4 pb-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>
        </CardContent>
      </Link>
      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground p-4 mt-auto bg-muted/50 border-t border-border">
        <div className="flex items-center gap-2">
          {articleCount !== undefined && (
            <span>
              {articleCount} {articleCount === 1 ? "item" : "items"}
            </span>
          )}
          {subsection && articleCount !== undefined && articleCount > 0 && (
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto px-2 py-1 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
              </HoverCardTrigger>
              <HoverCardContent
                className="w-80 p-0"
                side="top"
                align="center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col p-2">
                  <h4 className="text-sm font-semibold mb-2 px-2">Quick Preview</h4>
                  <Separator className="mb-1" />
                  <CategoryPreviewContent subsectionId={subsection.id} />
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
        {updatedAt && <span>Updated {formatDate(updatedAt)}</span>}
      </CardFooter>
    </Card>
  );
}