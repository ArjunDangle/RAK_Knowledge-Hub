import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search/SearchBar";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { ArticleCardSkeleton } from "@/components/ui/loading-skeleton"; // Corrected import
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { searchContent, getAllTags } from "@/lib/api/api-client";
import { SearchMode, SearchFilters, Group } from "@/lib/types/content";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    mode: (searchParams.get('mode') as SearchMode) || 'all',
    tags: searchParams.getAll('tags'), 
    groups: searchParams.getAll('groups') as Group[],
    sort: (searchParams.get('sort') as 'relevance' | 'date' | 'views') || 'relevance'
  });

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search', filters],
    queryFn: () => searchContent(filters),
    enabled: !!filters.query || filters.tags.length > 0
  });

  const { data: allTags } = useQuery({
    queryKey: ['tags'],
    queryFn: getAllTags
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    filters.tags.forEach(tag => params.append('tags', tag));
    if (filters.sort !== 'relevance') params.set('sort', filters.sort);
    
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const handleSearch = (query: string, mode: SearchMode) => {
    setFilters(prev => ({ ...prev, query, mode }));
  };

  const handleSortChange = (sort: string) => {
    setFilters(prev => ({ ...prev, sort: sort as 'relevance' | 'date' | 'views' }));
  };

  const toggleTag = (tagName: string) => {
    setFilters(prev => ({
      ...prev,
      tags: prev.tags.includes(tagName)
        ? prev.tags.filter(t => t !== tagName)
        : [...prev.tags, tagName]
    }));
  };

  const clearFilters = () => {
    setFilters(prev => ({
      ...prev,
      tags: [],
      groups: []
    }));
  };

  const breadcrumbs = [ { label: "Search Results" } ];

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Search</h1>
          <SearchBar
            variant="compact"
            defaultMode={filters.mode}
            defaultQuery={filters.query}
            onSearch={handleSearch}
            className="max-w-2xl"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Sort by</h3>
              <Select value={filters.sort} onValueChange={handleSortChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Recently Updated</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {allTags && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Tags</h3>
                  {(filters.tags.length > 0) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-auto p-1">
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={filters.tags.includes(tag.name) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/20"
                      onClick={() => toggleTag(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <div className="lg:col-span-3">
            {searchLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
                  {filters.query && ` for "${filters.query}"`}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {searchResults.map((article) => (
                    <ArticleCard 
                      key={article.id}
                      article={article} 
                      showGroup={true}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-lg h-full flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </KnowledgeLayout>
  );
}