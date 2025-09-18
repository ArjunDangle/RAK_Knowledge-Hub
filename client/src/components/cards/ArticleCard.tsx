// client/src/components/cards/ArticleCard.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Article } from "@/lib/types/content";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface ArticleCardProps {
  article: Article;
  showGroup?: boolean;
  className?: string;
  pastelColor?: string;
}

export function ArticleCard({
  article,
  showGroup = false,
  className,
  pastelColor = "bg-card",
}: ArticleCardProps) {
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

  const groupLabels = {
    departments: "Departments",
    "resource-centre": "Resource Centre",
    tools: "Tools",
  };

  const MAX_VISIBLE_TAGS = 2;
  const visibleTags = article.tags.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagsCount = article.tags.length - MAX_VISIBLE_TAGS;

  return (
    <Card
      className={cn(
        "group flex flex-col transition-all duration-300 border border-black/10 dark:border-white/10 shadow-md hover:scale-105 hover:shadow-xl hover:-translate-y-1 hover:border-secondary cursor-pointer",
        pastelColor,
        className
      )}
    >
      <Link to={`/article/${article.id}`} className="block h-full">
        <div className="flex flex-col h-full p-4">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground">
                  {article.title}
                </h3>
                {showGroup && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {groupLabels[article.group as keyof typeof groupLabels]}
                  </p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-grow">
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">
              {article.excerpt}
            </p>
          </CardContent>

          <div className="mt-auto">
            <div className="flex flex-wrap items-center gap-1 min-h-[22px]">
              {visibleTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs px-2 py-0"
                >
                  {tag.name}
                </Badge>
              ))}
              {hiddenTagsCount > 0 && (
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0 text-muted-foreground"
                >
                  +{hiddenTagsCount}
                </Badge>
              )}
            </div>

            <div className="pt-4">
              <Separator className="mb-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{article.readMinutes} min read</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <span>{article.views}</span>
                  </div>
                </div>
                <span>Updated {formatDate(article.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}