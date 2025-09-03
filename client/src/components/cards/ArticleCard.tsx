import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Article } from "@/lib/types/content";
import { cn } from "@/lib/utils";

interface ArticleCardProps {
  article: Article;
  showGroup?: boolean;
  className?: string;
}

export function ArticleCard({ article, showGroup = false, className }: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const groupLabels = {
    departments: 'Departments',
    'resource-centre': 'Resource Centre',
    tools: 'Tools'
  };

  return (
    <Card className={cn(
      "group transition-all duration-200 hover:shadow-md hover:-translate-y-1",
      "hover:border-primary/20 cursor-pointer border-border bg-card",
      className
    )}>
      {/* --- LINK NOW USES ARTICLE ID --- */}
      <Link to={`/article/${article.id}`} className="block h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors line-clamp-2">
                {article.title}
              </h3>
              {showGroup && (
                <p className="text-xs text-muted-foreground mt-1">
                  {groupLabels[article.group]}
                </p>
              )}
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 ml-2" />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
            {article.excerpt}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-4">
            {article.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs px-2 py-0">{tag.name}</Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{article.readMinutes} min read</span></div>
              <div className="flex items-center gap-1"><Eye className="h-3 w-3" /><span>{article.views}</span></div>
            </div>
            <span>Updated {formatDate(article.updatedAt)}</span>
          </div>
        </CardContent>
      </Link>
    </Card>
  );
}