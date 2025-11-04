// client/src/pages/CategoryPage.tsx
import { useParams } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query"; // <-- STEP 4.2: IMPORT ADDED
import { Fragment } from "react"; // <-- STEP 4.2: IMPORT ADDED
import { Loader2 } from "lucide-react"; // <-- STEP 4.2: IMPORT ADDED

import { ArticleCard } from "@/components/cards/ArticleCard";
import { CategoryCard } from "@/components/cards/CategoryCard";
import { ArticleCardSkeleton, CategoryCardSkeleton } from "@/components/ui/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // <-- STEP 4.2: IMPORT ADDED
import { KnowledgeLayout } from "@/pages/KnowledgeLayout";
import { getSubsectionsByGroup, getPageContents, getPageById, getAncestors } from "@/lib/api/api-client";
import { Group } from "@/lib/types/content";
import { getColorFromId } from "@/lib/utils/visual-utils";

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

  // --- STEP 4.2: 'useQuery' for contents REPLACED with 'useInfiniteQuery' ---
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['pageContents', pageId],
    queryFn: ({ pageParam = 1 }) => getPageContents(pageId!, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.page + 1 : undefined;
    },
    enabled: isNestedPage,
  });
  // --- END OF REFACTOR ---

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
    if (pageDetailsLoading || subsectionsLoading || isLoading) { // Added isLoading
      return <KnowledgeLayout><div className="text-center py-12"><h1 className="text-2xl font-bold">Loading...</h1></div></KnowledgeLayout>;
    }
    return <KnowledgeLayout><div className="text-center py-12"><h1 className="text-2xl font-bold">Category Not Found</h1></div></KnowledgeLayout>;
  }
  
  const info = groupInfo[currentGroup];
  const responsiveGridClass = "grid grid-cols-[repeat(auto-fit,minmax(20rem,1fr))] gap-6";

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
          <div className="max-w-4xl mx-auto">
            {pageDetailsLoading ? (
              <div className="space-y-4 mb-8">
                <Skeleton className="h-10 w-3/4 mx-auto" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
              </div>
            ) : pageDetailsError || !currentPageData ? (
              <div className="text-center py-12"><h1 className="text-2xl font-bold">Page Not Found</h1></div>
            ) : (
              <div className="mb-6">
                <header className="mb-6 text-center">
                  <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">{currentPageData.title}</h1>
                </header>
                {currentPageData.html && (
                  <>
                    <Separator className="mb-6" />
                    <div 
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: currentPageData.html }} 
                    />
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* --- STEP 4.3: UI UPDATE for Loading State --- */}
          {isLoading ? (
            <div className={`${responsiveGridClass} mt-12`}>{Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}</div>
          
          /* --- STEP 4.3: UI UPDATE for Data Rendering --- */
          ) : data && data.pages.length > 0 && data.pages[0].items.length > 0 ? (
            <>
              <div className={`${responsiveGridClass} mt-12`}>
                {data.pages.map((page, i) => (
                  <Fragment key={i}>
                    {page.items.map((item) => item.type === 'subsection' ? (
                      <CategoryCard key={item.id} title={item.title} description={item.description} subsection={item} articleCount={item.articleCount} updatedAt={item.updatedAt} href={`/page/${item.id}`} />
                    ) : (
                      <ArticleCard key={item.id} article={item} pastelColor={getColorFromId(item.id)} />
                    ))}
                  </Fragment>
                ))}
              </div>

              {/* --- STEP 4.3: "LOAD MORE" BUTTON ADDED --- */}
              {hasNextPage && (
                <div className="mt-10 text-center">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </>
          /* --- STEP 4.3: UI UPDATE for Empty State --- */
          ) : !pageDetailsLoading && (
            <div className="text-center py-12 bg-muted/20 rounded-lg max-w-4xl mx-auto"><p className="text-muted-foreground">This section is empty.</p></div>
          )}

          {currentPageData && currentPageData.tags.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <Separator className="my-8" />
              <div className="flex flex-wrap gap-2 justify-center">{currentPageData.tags.map((tag) => <Badge key={tag.id} variant="outline">{tag.name}</Badge>)}</div>
            </div>
          )}
        </div>
      </KnowledgeLayout>
    );
  }

  // This is the top-level page (e.g., /category/departments)
  // This query was not specified as paginated, so it remains a normal useQuery
  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div>
        <div className="mb-8 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">{info.title}</h1>
          <p className="text-lg text-muted-foreground">{info.description}</p>
        </div>
        {subsectionsLoading ? (
          <div className={responsiveGridClass}>{Array.from({ length: 6 }).map((_, i) => <CategoryCardSkeleton key={i} />)}</div>
        ) : topLevelSubsections && topLevelSubsections.length > 0 ? (
          <div className={responsiveGridClass}>
            {topLevelSubsections.map((subsection) => (
              <CategoryCard 
                key={subsection.id} 
                title={subsection.title} 
                description={subsection.description} 
                subsection={subsection}
                articleCount={subsection.articleCount} 
                updatedAt={subsection.updatedAt} 
                href={`/page/${subsection.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12"><p className="text-muted-foreground">No subsections found in this category.</p></div>
        )}
      </div>
    </KnowledgeLayout>
  );
}