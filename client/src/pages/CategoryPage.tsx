// client/src/pages/CategoryPage.tsx
import { useParams } from "react-router-dom";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Fragment } from "react";
import { Loader2 } from "lucide-react";

import { ArticleCard } from "@/components/cards/ArticleCard";
import { CategoryCard } from "@/components/cards/CategoryCard";
import { CategoryCardSkeleton } from "@/components/ui/loading-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    if (pageDetailsLoading || subsectionsLoading || isLoading) {
      return <KnowledgeLayout><div className="text-center py-12"><h1 className="text-2xl font-bold">Loading...</h1></div></KnowledgeLayout>;
    }
    return <KnowledgeLayout><div className="text-center py-12"><h1 className="text-2xl font-bold">Category Not Found</h1></div></KnowledgeLayout>;
  }
  
  const info = groupInfo[currentGroup];

  const breadcrumbs = isNestedPage 
    ? (ancestors || []).map((ancestor, index) => {
        if (index === 0) {
          // The first ancestor links to the main category page
          return { label: ancestor.title, href: `/category/${currentGroup}` };
        }
        // Subsequent ancestors link to their respective pages
        return { label: ancestor.title, href: `/page/${ancestor.id}` };
      }).concat(currentPageData ? [{ label: currentPageData.title, href: `/page/${pageId}` }] : []) // Add href to the current page
    : [{ label: info.title, href: `/category/${group}` }];
  
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
                      className="prose dark:prose-invert max-w-none break-words"
                      dangerouslySetInnerHTML={{ __html: currentPageData.html }} 
                    />
                  </>
                )}
              </div>
            )}
          </div>
          
          {isLoading ? (
            // Loading Skeletons: Centered with fixed widths to prevent jumping
            <div className="flex flex-wrap justify-center gap-6 mt-12">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="w-full max-w-[22rem]">
                  <Skeleton className="h-48 w-full" />
                </div>
              ))}
            </div>
          ) : data && data.pages.length > 0 && data.pages[0].items.length > 0 ? (
            <>
              {/* DYNAMIC ALIGNMENT LOGIC */}
              {(() => {
                // 1. Flatten all items to check what content we have
                const allItems = data.pages.flatMap((p) => p.items);
                
                // 2. Check if ANY item is a Category (subsection)
                const hasCategories = allItems.some((item) => item.type === "subsection");
                
                // 3. Define alignment: 
                // - If categories exist (or mixed) -> Center
                // - If ONLY articles -> Start (Left align)
                const alignmentClass = hasCategories ? "justify-center" : "justify-start";

                return (
                  <div className={`flex flex-wrap ${alignmentClass} gap-6 mt-12`}>
                    {data.pages.map((page, i) => (
                      <Fragment key={i}>
                        {page.items.map((item, index) =>
                          item.type === "subsection" ? (
                            <CategoryCard
                              key={item.id}
                              title={item.title}
                              description={item.description}
                              subsection={item}
                              articleCount={item.articleCount}
                              updatedAt={item.updatedAt}
                              href={`/page/${item.id}`}
                              index={index}
                              // FIXED WIDTH CONSTRAINT
                              className="w-full max-w-[22rem]"
                            />
                          ) : (
                            <ArticleCard
                              key={item.id}
                              article={item}
                              pastelColor={getColorFromId(item.id)}
                              // FIXED WIDTH CONSTRAINT
                              className="w-full max-w-[22rem]"
                            />
                          )
                        )}
                      </Fragment>
                    ))}
                  </div>
                );
              })()}

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
  // Constraint: Top level pages always contain categories, so we always Center them.
  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div>
        <div className="mb-8 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">{info.title}</h1>
          <p className="text-lg text-muted-foreground">{info.description}</p>
        </div>
        {subsectionsLoading ? (
          <div className="flex flex-wrap justify-center gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-full max-w-[22rem]">
                <CategoryCardSkeleton />
              </div>
            ))}
          </div>
        ) : topLevelSubsections && topLevelSubsections.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-6">
            {topLevelSubsections.map((subsection, index) => (
              <CategoryCard 
                key={subsection.id} 
                title={subsection.title} 
                description={subsection.description} 
                subsection={subsection}
                articleCount={subsection.articleCount} 
                updatedAt={subsection.updatedAt} 
                href={`/page/${subsection.id}`}
                className="w-full max-w-[22rem]"
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