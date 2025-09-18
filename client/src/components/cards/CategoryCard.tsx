import { Card } from "@/components/ui/card";
import { Eye, FileText, Folder } from "lucide-react";
import { Link } from "react-router-dom";
import { Subsection } from "@/lib/types/content";
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
import { getCardHeaderImage, getCardIcon } from "@/lib/utils/visual-utils";
import { useState } from "react";

interface CategoryCardProps {
  title: string;
  description: string;
  subsection?: Subsection;
  articleCount?: number;
  updatedAt?: string;
  href: string;
  className?: string;
  isCompact?: boolean;
}

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
  subsection,
  articleCount,
  updatedAt,
  href,
  className,
  isCompact = false,
}: CategoryCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const id = subsection?.id || title;
  const headerImage = getCardHeaderImage(id);
  const Icon = getCardIcon(id);

  return (
    <Card
      className={cn(
        "group relative flex flex-col justify-end transition-all duration-300 shadow-lg overflow-hidden bg-cover bg-center border border-black/10 dark:border-white/10",
        "hover:shadow-xl hover:border-secondary",
        isCompact ? "h-72" : "h-80",
        isPreviewOpen ? "scale-105 shadow-xl border-secondary" : "hover:scale-105",
        className
      )}
      style={{ backgroundImage: `url(${headerImage})` }}
    >
      <Link to={href} className="contents">
        <div className="relative flex h-full flex-col p-4 text-center">
          
          <div className="flex-grow flex flex-col items-center justify-center">
            <Icon className={cn("text-foreground", isCompact ? "h-12 w-12" : "h-14 w-14")} />
            <h3 className={cn("mt-4 font-bold text-foreground", isCompact ? "text-xl" : "text-2xl")}>
                {title}
            </h3>
            <p className={cn("mt-1 text-muted-foreground line-clamp-2", isCompact ? "text-sm" : "text-base")}>
                {description}
            </p>
          </div>

          <div className="flex w-full items-center justify-center gap-4 pt-4 text-sm font-semibold text-foreground">
              {articleCount !== undefined && (
                  <span className={cn("flex items-center", isCompact && "text-xs")}>
                  {articleCount} {articleCount === 1 ? "item" : "items"}
                  </span>
              )}
              {subsection && articleCount !== undefined && articleCount > 0 && (
                  <HoverCard onOpenChange={setIsPreviewOpen}>
                  <HoverCardTrigger asChild>
                      <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-auto px-2 py-1 font-semibold", isCompact ? "text-xs" : "text-sm")}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      >
                      <Eye className={cn("mr-1", isCompact ? "h-3 w-3" : "h-4 w-4")} />
                      Preview
                      </Button>
                  </HoverCardTrigger>
                  <HoverCardContent
                      className="w-80 p-0"
                      side="top"
                      align="center"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                      <div className="flex flex-col p-2">
                      <h4 className="text-sm font-semibold mb-2 px-2">Quick Preview</h4>
                      <Separator className="mb-1" />
                      <CategoryPreviewContent subsectionId={subsection.id} />
                      </div>
                  </HoverCardContent>
                  </HoverCard>
              )}
              {updatedAt && <span className={cn(isCompact && "text-xs")}>Updated {formatDate(updatedAt)}</span>}
          </div>
        </div>
      </Link>
    </Card>
  );
}