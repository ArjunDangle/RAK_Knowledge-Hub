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

interface CategoryCardProps {
  title: string;
  description: string;
  subsection?: Subsection;
  articleCount?: number;
  updatedAt?: string;
  href: string;
  className?: string;
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
}: CategoryCardProps) {
  const formatDate = (dateString?: string) => {
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
        "group relative flex h-80 flex-col justify-end transition-all duration-300 shadow-lg hover:scale-105 hover:shadow-xl overflow-hidden bg-cover bg-center border border-black/10 dark:border-white/10 hover:border-secondary",
        className
      )}
      style={{ backgroundImage: `url(${headerImage})` }}
    >
      <Link to={href} className="contents">
        <div className="relative flex h-full flex-col p-4 text-center">
          
          <div className="flex-grow flex flex-col items-center justify-center">
            <Icon className="h-14 w-14 text-foreground" />
            <h3 className="mt-4 text-2xl font-bold text-foreground">
                {title}
            </h3>
            <p className="mt-2 text-base text-muted-foreground line-clamp-2">
                {description}
            </p>
          </div>

          <div className="mt-auto flex w-full items-center justify-between pt-4 text-sm font-semibold text-foreground">
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
                      className="h-auto px-2 py-1 text-sm font-semibold"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      >
                      <Eye className="h-4 w-4 mr-1" />
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
              </div>
              {updatedAt && <span>Updated {formatDate(updatedAt)}</span>}
          </div>
        </div>
      </Link>
    </Card>
  );
}