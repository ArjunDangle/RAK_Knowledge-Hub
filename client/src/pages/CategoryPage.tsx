import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { CategoryCard } from "@/components/cards/CategoryCard";
import { ArticleCardSkeleton, CategoryCardSkeleton } from "@/components/ui/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { getSubsectionsByGroup, getPageContents, getPageById, getAncestors } from "@/lib/api/api-client";
import { Group } from "@/lib/types/content";

const groupInfo = {
  departments: { title: "Departments", description: "Resources organized by team functions" },
  "resource-centre": { title: "Resource Centre", description: "Comprehensive knowledge base and documentation" },
  tools: { title: "Tools", description: "Development tools, utilities, and platform guides" }
};

export default function CategoryPage() {
  const { group, pageId } = useParams<{ group?: Group; pageId?: string }>();
  
  const isTopLevelPage = !!group && !pageId;
  const isNestedPage = !!pageId;

  const { data: currentPageData, isLoading: pageDetailsLoading, isError: pageDetailsError } = useQuery({
    queryKey: ['pageDetails', pageId],
    queryFn: () => getPageById(pageId!),
    enabled: isNestedPage,
  });

  const { data: contents, isLoading: contentsLoading } = useQuery({
    queryKey: ['pageContents', pageId],
    queryFn: () => getPageContents(pageId!),
    enabled: isNestedPage,
  });

  const { data: topLevelSubsections, isLoading: subsectionsLoading } = useQuery({
    queryKey: ['topLevelSubsections', group],
    queryFn: () => getSubsectionsByGroup(group!),
    enabled: isTopLevelPage,
  });

  const { data: ancestors } = useQuery({
    queryKey: ['ancestors', pageId],
    queryFn: () => getAncestors(pageId!),
    enabled: isNestedPage,
  });

  const currentGroup = isNestedPage ? currentPageData?.group as Group : group;

  if (!currentGroup || !(currentGroup in groupInfo)) {
    if (pageDetailsLoading || subsectionsLoading) {
      return <KnowledgeLayout><div className="text-center py-12"><h1 className="text-2xl font-bold">Loading...</h1></div></KnowledgeLayout>;
    }
    return <KnowledgeLayout><div className="text-center py-12"><h1 className="text-2xl font-bold">Category Not Found</h1></div></KnowledgeLayout>;
  }
  
  const info = groupInfo[currentGroup];

  // Dynamically build detailed breadcrumbs
  const breadcrumbs = isNestedPage 
    ? (ancestors || []).map((ancestor, index) => {
        if (index === 0) {
          return { label: ancestor.title, href: `/category/${currentGroup}` };
        }
        return { label: ancestor.title, href: `/page/${ancestor.id}` };
      }).concat(currentPageData ? [{ label: currentPageData.title }] : [])
    : [{ label: info.title }];

  if (isNestedPage) {
    return (
      <KnowledgeLayout breadcrumbs={breadcrumbs}>
        <div>
          {pageDetailsLoading ? (
            <div className="space-y-4 mb-8"><Skeleton className="h-8 w-2/3" /><Skeleton className="h-4 w-full" /></div>
          ) : pageDetailsError || !currentPageData ? (
            <div className="text-center py-12"><h1 className="text-2xl font-bold">Page Not Found</h1></div>
          ) : (
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-4">{currentPageData.title}</h1>
              <p className="text-lg text-muted-foreground mb-4">{currentPageData.description}</p>
              <div className="flex flex-wrap gap-2">{currentPageData.tags.map((tag) => <Badge key={tag.id} variant="outline">{tag.name}</Badge>)}</div>
            </div>
          )}
          <h2 className="text-xl font-semibold text-foreground mb-4">Contents</h2>
          {contentsLoading || pageDetailsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}</div>
          ) : contents && contents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {contents.map((item) => item.type === 'subsection' ? (
                <CategoryCard key={item.id} title={item.title} description={item.description} subsection={item} articleCount={item.articleCount} updatedAt={item.updatedAt} href={`/page/${item.id}`} />
              ) : (
                <ArticleCard key={item.id} article={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-lg"><p className="text-muted-foreground">This section is empty.</p></div>
          )}
        </div>
      </KnowledgeLayout>
    );
  }

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">{info.title}</h1>
          <p className="text-lg text-muted-foreground">{info.description}</p>
        </div>
        {subsectionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => <CategoryCardSkeleton key={i} />)}</div>
        ) : topLevelSubsections && topLevelSubsections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topLevelSubsections.map((subsection) => (
              <CategoryCard key={subsection.id} title={subsection.title} description={subsection.description} subsection={subsection} articleCount={subsection.articleCount} updatedAt={subsection.updatedAt} href={`/page/${subsection.id}`} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12"><p className="text-muted-foreground">No subsections found in this category.</p></div>
        )}
      </div>
    </KnowledgeLayout>
  );
}