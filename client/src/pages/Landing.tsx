// client/src/pages/Landing.tsx
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SearchBar } from "@/components/search/SearchBar";
import { CategoryCard } from "@/components/cards/CategoryCard";
import { ArticleCard } from "@/components/cards/ArticleCard";
// --- STEP 5: CLEANUP ---
// Skeletons removed as metadata now loads near-instantly from the DB
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react"; // Added Loader2 for loading
import { formatRelativeTime } from "@/lib/utils/date";
import ChatbotWidget from "@/components/chatbot/ChatbotWidget";
import { useState } from "react";
// --- FIX: CORRECTED IMPORT PATH ---
import { getColorFromId } from "@/lib/utils/visual-utils";
import { Subsection, Article, SearchMode } from "@/lib/types/content";
import { getGroups, getSubsectionsByGroup, getPopularArticles, getRecentArticles } from "@/lib/api/api-client";

export default function Landing() {
  const { data: groups, isLoading: groupsLoading } = useQuery({ queryKey: ['groups'], queryFn: getGroups });
  const { data: departmentSubs, isLoading: deptLoading } = useQuery({ queryKey: ['subsections', 'departments'], queryFn: () => getSubsectionsByGroup('departments') });
  const { data: resourceSubs, isLoading: resourceLoading } = useQuery({ queryKey: ['subsections', 'resource-centre'], queryFn: () => getSubsectionsByGroup('resource-centre') });
  const { data: toolSubs, isLoading: toolsLoading } = useQuery({ queryKey: ['subsections', 'tools'], queryFn: () => getSubsectionsByGroup('tools') });
  const { data: popularArticles, isLoading: popularLoading } = useQuery({ queryKey: ['articles', 'popular'], queryFn: () => getPopularArticles(4) });
  const { data: recentArticles, isLoading: recentLoading } = useQuery({ queryKey: ['articles', 'recent'], queryFn: () => getRecentArticles(7) });
  
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('all');

  const handleSearch = () => {
    if (query.trim()) {
      const params = new URLSearchParams();
      params.append('q', query.trim());
      params.append('mode', mode);
      navigate(`/search?${params.toString()}`);
    }
  };

  const renderCategorySection = (
    title: string, description: string, subsections: Subsection[] | undefined, loading: boolean
  ) => (
    <section className="mb-16">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* --- STEP 5: SKELETONS REMOVED --- */}
        {loading ? (
          <div className="flex items-center justify-center col-span-4 h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
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
      <div className="bg-black text-white">
        <div className="container max-w-7xl mx-auto px-6 py-12 md:py-20">
          <section className="text-center mb-16">
            <div className="max-w-3xl mx-auto mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">RAKwireless Knowledge Hub</h1>
              <p className="text-xl leading-relaxed text-white/80">Your comprehensive resource for documentation, guides, and technical knowledge.</p>
            </div>
            <SearchBar 
              variant="hero"
              query={query}
              onQueryChange={setQuery}
              mode={mode}
              onModeChange={setMode}
              onSearch={handleSearch}
            />
          </section>
        </div>
      </div>
      
      <main className="container max-w-7xl mx-auto px-6 py-12">
        {groupsLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : groups?.map(groupInfo => (
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
              {/* --- STEP 5: SKELETONS REMOVED --- */}
              {popularLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-48 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {popularArticles?.map((article) => (
                    <ArticleCard 
                      key={article.id} 
                      article={article} 
                      showGroup={true} 
                      pastelColor={getColorFromId(article.id)} />
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
                {/* --- STEP 5: SKELETONS REMOVED --- */}
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