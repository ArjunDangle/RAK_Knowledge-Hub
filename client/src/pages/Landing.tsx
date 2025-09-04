import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SearchBar } from "@/components/search/SearchBar";
import { CategoryCard } from "@/components/cards/CategoryCard";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { CategoryCardSkeleton, ArticleCardSkeleton } from "@/components/ui/loading-skeleton";
import { getGroups, getSubsectionsByGroup, getPopularArticles, getRecentArticles } from "@/lib/api/api-client";
import { Subsection } from "@/lib/types/content";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";

export default function Landing() {
  const { data: groups, isLoading: groupsLoading } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: departmentSubs, isLoading: deptLoading } = useQuery({ queryKey: ['subsections', 'departments'], queryFn: () => getSubsectionsByGroup('departments') });
  const { data: resourceSubs, isLoading: resourceLoading } = useQuery({ queryKey: ['subsections', 'resource-centre'], queryFn: () => getSubsectionsByGroup('resource-centre') });
  const { data: toolSubs, isLoading: toolsLoading } = useQuery({ queryKey: ['subsections', 'tools'], queryFn: () => getSubsectionsByGroup('tools') });
  const { data: popularArticles, isLoading: popularLoading } = useQuery({ queryKey: ['articles', 'popular'], queryFn: () => getPopularArticles(6) });
  const { data: recentArticles, isLoading: recentLoading } = useQuery({ queryKey: ['articles', 'recent'], queryFn: () => getRecentArticles(6) });

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
              // --- THIS IS THE FIX ---
              href={`/page/${subsection.id}`}
            />
          ))
        )}
      </div>
    </section>
  );

  const renderArticleSection = (
    title: string, description: string, articles: any[] | undefined, loading: boolean
  ) => (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)
        ) : (
          articles?.map((article) => (
            <ArticleCard key={article.id} article={article} showGroup={true} />
          ))
        )}
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader variant="landing" />
      <main className="container max-w-7xl mx-auto px-6 py-12">
        <section className="text-center mb-16">
          <div className="max-w-3xl mx-auto mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">RAKwireless Knowledge Hub</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">Your comprehensive resource for documentation, guides, and technical knowledge.</p>
          </div>
          <SearchBar variant="hero" />
        </section>

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

        {renderArticleSection("Popular Articles", "Most viewed content across all categories", popularArticles, popularLoading)}
        {renderArticleSection("Recently Updated", "Latest updates and new content", recentArticles, recentLoading)}
      </main>
      <ChatbotWidget />
    </div>
  );
}