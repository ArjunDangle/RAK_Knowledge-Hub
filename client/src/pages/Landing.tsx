import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SearchBar } from "@/components/search/SearchBar";
import { CategoryCard } from "@/components/cards/CategoryCard";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { CategoryCardSkeleton, ArticleCardSkeleton } from "@/components/ui/loading-skeleton";
import { getGroups, getSubsectionsByGroup, getPopularArticles, getRecentArticles } from "@/lib/api/api-client";
import { Group, Subsection, Article } from "@/lib/types/content";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils/date";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget"

export default function Landing() {
  const { data: groups, isLoading: groupsLoading } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: departmentSubs, isLoading: deptLoading } = useQuery({ queryKey: ['subsections', 'departments'], queryFn: () => getSubsectionsByGroup('departments') });
  const { data: resourceSubs, isLoading: resourceLoading } = useQuery({ queryKey: ['subsections', 'resource-centre'], queryFn: () => getSubsectionsByGroup('resource-centre') });
  const { data: toolSubs, isLoading: toolsLoading } = useQuery({ queryKey: ['subsections', 'tools'], queryFn: () => getSubsectionsByGroup('tools') });
  
  // --- UPDATED TO FETCH 4 POPULAR ARTICLES ---
  const { data: popularArticles, isLoading: popularLoading } = useQuery({ queryKey: ['articles', 'popular'], queryFn: () => getPopularArticles(4) });
  
  // --- UPDATED TO FETCH 7 RECENT ARTICLES ---
  const { data: recentArticles, isLoading: recentLoading } = useQuery({ queryKey: ['articles', 'recent'], queryFn: () => getRecentArticles(7) });

  const renderCategorySection = (
    title: string, description: string, subsections: Subsection[] | undefined, loading: boolean
  ) => (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CategoryCardSkeleton key={i} />)
        ) : (
          subsections?.slice(0, 4).map((subsection) => (
            <CategoryCard
              key={subsection.id}
              title={subsection.title}
              description={subsection.description}
              subsection={subsection}
              articleCount={subsection.articleCount}
              updatedAt={subsection.updatedAt}
              href={`/page/${subsection.id}`}
            />
          ))
        )}
      </div>
    </section>
  );

  const RecentArticleItem = ({ article }: { article: Article }) => (
    <Link to={`/article/${article.id}`} className="group block p-3 border-b last:border-b-0 hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{article.title}</p>
          <p className="text-xs text-muted-foreground">{formatRelativeTime(article.updatedAt)}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground ml-2 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader logoSrc="/rak-logo.png"/>
      <div style={{ backgroundColor: 'hsl(var(--foreground))', color: 'hsl(var(--background))' }}>
        <div className="container max-w-7xl mx-auto px-6 py-12 md:py-20">
          <section className="text-center mb-16">
            <div className="max-w-3xl mx-auto mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'hsl(var(--background))' }}>RAKwireless Knowledge Hub</h1>
              <p className="text-xl leading-relaxed" style={{ color: 'hsl(var(--border))' }}>Your comprehensive resource for documentation, guides, and technical knowledge.</p>
            </div>
            <SearchBar variant="hero" />
          </section>
        </div>
      </div>
      
      <main className="container max-w-7xl mx-auto px-6 py-12">
        {groupsLoading ? <p>Loading categories...</p> : groups?.map(groupInfo => (
          <div key={groupInfo.id}>
            {renderCategorySection(
              groupInfo.title,
              groupInfo.description,
              groupInfo.id === 'departments' ? departmentSubs : groupInfo.id === 'resource-centre' ? resourceSubs : toolSubs,
              groupInfo.id === 'departments' ? deptLoading : groupInfo.id === 'resource-centre' ? resourceLoading : toolsLoading
            )}
          </div>
        ))}

        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8 gap-y-12">
            
            <div className="lg:col-span-2">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Popular Articles</h2>
                <p className="text-muted-foreground">Most viewed content across all categories</p>
              </div>
              {popularLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {popularArticles?.map((article) => (
                    <ArticleCard key={article.id} article={article} showGroup={true} />
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Recently Updated</h2>
                <p className="text-muted-foreground">The latest updates and new content</p>
              </div>
              <div className="border rounded-lg">
                {recentLoading ? (
                  <div className="p-3 space-y-3">
                    {Array.from({ length: 7 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                ) : (
                  <div>
                    {recentArticles?.map((article) => (
                      <RecentArticleItem key={article.id} article={article} />
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>
      </main>
      <ChatbotWidget />
    </div>
  );
}