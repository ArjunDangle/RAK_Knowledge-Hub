import { useQuery } from "@tanstack/react-query";
import { Calendar, FileText, Megaphone, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { KnowledgeLayout } from "./KnowledgeLayout";
// CHANGE THIS IMPORT
import { getWhatsNew } from "@/lib/api/api-client";

const typeIcons = {
  new: Plus,
  update: FileText,
  announcement: Megaphone
};

const typeColors = {
  new: 'bg-success/10 text-success border-success/20',
  update: 'bg-primary/10 text-primary border-primary/20',
  announcement: 'bg-accent/10 text-accent-foreground border-accent/20'
};

export default function WhatsNewPage() {
  const { data: updates, isLoading } = useQuery({
    queryKey: ['whats-new'],
    queryFn: getWhatsNew
  });

  const breadcrumbs = [
    { label: "What's New" }
  ];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">What's New</h1>
          <p className="text-lg text-muted-foreground">
            Stay up to date with the latest updates, new content, and announcements.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : updates && updates.length > 0 ? (
          <div className="space-y-6">
            {updates.map((update) => {
              const IconComponent = typeIcons[update.type];
              const colorClass = typeColors[update.type];
              
              return (
                <Card key={update.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${colorClass} border`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="capitalize">
                            {update.type}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={update.date}>
                              {formatDate(update.date)}
                            </time>
                          </div>
                        </div>
                        
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                          {update.articleSlug ? (
                            <Link 
                              to={`/article/${update.articleSlug}`}
                              className="hover:text-primary transition-colors"
                            >
                              {update.title}
                            </Link>
                          ) : (
                            update.title
                          )}
                        </h2>
                        
                        <p className="text-muted-foreground leading-relaxed">
                          {update.summary}
                        </p>
                      </div>
                      
                      <div className="text-xs text-muted-foreground text-right">
                        {formatTime(update.date)}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/20 rounded-lg">
            <Megaphone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No updates yet</h3>
            <p className="text-muted-foreground">
              Check back soon for the latest updates and announcements.
            </p>
          </div>
        )}
      </div>
    </KnowledgeLayout>
  );
}