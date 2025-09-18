import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search/SearchBar";
import { ArticleCard } from "@/components/cards/ArticleCard";
import { ArticleCardSkeleton } from "@/components/ui/loading-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KnowledgeLayout } from "./KnowledgeLayout";
import { searchContent, getAllTags } from "@/lib/api/api-client";
import { SearchMode, SearchFilters, Group, Tag } from "@/lib/types/content";
import { X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getColorFromId } from "@/lib/utils/visual-utils";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State for the interactive search bar inputs
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [mode, setMode] = useState<SearchMode>((searchParams.get('mode') as SearchMode) || 'all');
  const [sort, setSort] = useState<'relevance' | 'date' | 'views'>((searchParams.get('sort') as 'relevance' | 'date' | 'views') || 'relevance');

  // State for the actual search filters sent to the API
  const [filters, setFilters] = useState<SearchFilters>({
    query: query, mode: mode, tags: [], groups: searchParams.getAll('groups') as Group[], sort: sort
  });

  // State for the modal
  const [dialogOpen, setDialogOpen] = useState(false);
  const [temporarySelectedTags, setTemporarySelectedTags] = useState<Set<string>>(new Set());

  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['search', filters],
    queryFn: () => searchContent(filters),
    enabled: !!filters.query || (filters.mode === 'tags' && filters.query.trim() !== '')
  });

  const { data: allTags } = useQuery({ queryKey: ['tags'], queryFn: getAllTags });

  // Group tags alphabetically for the modal display
  const groupedTags = useMemo(() => {
    if (!allTags) return {};
    const groups: { [key: string]: Tag[] } = {
        'A-C': [], 'D-L': [], 'M-R': [], 'S-Z': [],
    };
    allTags.forEach(tag => {
        const firstLetter = tag.name[0]?.toUpperCase();
        if (firstLetter >= 'A' && firstLetter <= 'C') groups['A-C'].push(tag);
        else if (firstLetter >= 'D' && firstLetter 
 <= 'L') groups['D-L'].push(tag);
        else if (firstLetter >= 'M' && firstLetter <= 'R') groups['M-R'].push(tag);
        else if (firstLetter >= 'S' && firstLetter <= 'Z') groups['S-Z'].push(tag);
    });
    return groups;
  }, [allTags]);

  // Update URL when a search is executed
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.mode !== 'all') params.set('mode', filters.mode);
    if (filters.sort !== 'relevance') params.set('sort', filters.sort);
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Sync the search bar inputs when filters are updated
  useEffect(() => {
    setQuery(filters.query);
    setMode(filters.mode);
    setSort(filters.sort);
  }, [filters]);

  const handleExecuteSearch = () => {
    const cleanedQuery = query.trim().replace(/\s+/g, ' ');
    setFilters(prev => ({ ...prev, query: cleanedQuery, mode, sort }));
  };

  const handleSortChange = (sortValue: string) => {
    const newSort = sortValue as 'relevance' | 'date' | 'views';
    setSort(newSort);
    setFilters(prev => ({ ...prev, sort: newSort }));
  };

  // Syncs temporary modal state when it opens
  const handleModalOpen = (isOpen: boolean) => {
    if (isOpen) {
        const currentTagsInQuery = (mode === 'tags' && query) ?
 query.split(' ').filter(Boolean) : [];
        setTemporarySelectedTags(new Set(currentTagsInQuery));
    }
    setDialogOpen(isOpen);
  };

  const handleTemporaryTagToggle = (tagName: string) => {
    setTemporarySelectedTags(prev => {
        const newSet = new Set(prev);
        if (newSet.has(tagName)) {
            newSet.delete(tagName);
        } else {
            newSet.add(tagName);
        }
        return newSet;
    });
  };

  const handleApplyTagSelection = () => {
    const newQuery = Array.from(temporarySelectedTags).join(' ');
    const newMode = newQuery ?
 'tags' : 'all';
    setQuery(newQuery);
    setMode(newMode);
    setFilters(prev => ({ ...prev, query: newQuery, mode: newMode }));
    setDialogOpen(false);
  };

  const handleRemoveTag = (tagNameToRemove: string) => {
    const updatedQuery = query.split(' ').filter(tag => tag !== tagNameToRemove).join(' ');
    const newMode = updatedQuery ? 'tags' : 'all';
    setQuery(updatedQuery);
    setMode(newMode);
    setFilters(prev => ({ ...prev, query: updatedQuery, mode: newMode }));
  };

  const currentSelectedTags = useMemo(() => {
    return (mode === 'tags' && query) ? query.split(' ').filter(Boolean) : [];
  }, [query, mode]);

  const breadcrumbs = [{ label: "Search Results" }];

  return (
    <KnowledgeLayout breadcrumbs={breadcrumbs}>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-4">Search</h1>
          <SearchBar variant="compact" query={query} onQueryChange={setQuery} mode={mode} onModeChange={setMode} onSearch={handleExecuteSearch} className="max-w-2xl"/>
          
          {currentSelectedTags.length > 0 && (
              <div className="mt-4 
 flex flex-wrap gap-2 items-center max-w-2xl">
                  {currentSelectedTags.map((tagName) => (
                      <Badge key={tagName} variant="default" className="cursor-pointer group/badge" onClick={() => handleRemoveTag(tagName)}>
                          {tagName}
                     
           <X className="ml-1.5 h-3 w-3 rounded-full group-hover/badge:bg-destructive-foreground/20" />
                      </Badge>
                  ))}
              </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
     
           <aside className="lg:col-span-1 space-y-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Sort by</h3>
              <Select value={sort} onValueChange={handleSortChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
              
               <SelectItem value="relevance">Relevance</SelectItem>
                  <SelectItem value="date">Recently Updated</SelectItem>
                  <SelectItem value="views">Most Viewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {allTags 
 && (
              <div>
                <Dialog open={dialogOpen} onOpenChange={handleModalOpen}>
                  <DialogTrigger asChild>
                    <div className="w-full">
                        <h3 className="font-semibold text-foreground 
 mb-3">Filter by Tag</h3>
                        <Button variant="outline" className="w-full justify-start">Select one or more tags...</Button>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl">
          
                     <DialogHeader>
                      <DialogTitle>Filter by Tag</DialogTitle>
                    </DialogHeader>
                    <Alert>
                      <Info className="h-4 w-4" />
 
                       <AlertDescription>
                        Select one or more tags to add them to your search query.
 The search mode will automatically be set to "Tags".
                      </AlertDescription>
                    </Alert>
                    <div className="grid grid-cols-4 gap-x-6 gap-y-4 py-4">
                      {Object.entries(groupedTags).map(([groupName, tagsInGroup]) => (
                     
       <div key={groupName} className="space-y-2">
                          <h4 className="font-semibold text-sm text-muted-foreground border-b pb-1 mb-2">{groupName}</h4>
                          <div className="flex flex-col items-start space-y-1">
                            {tagsInGroup.map(tag => (
   
                               <button
                                key={tag.id}
                                onClick={() => handleTemporaryTagToggle(tag.name)}
       
                                 className={cn(
                                  "text-sm text-foreground text-left rounded-sm px-1 -mx-1 hover:bg-accent w-full",
                                  
  temporarySelectedTags.has(tag.name) && "underline text-primary font-semibold"
                                )}
                              >
                                {tag.name}
  
                               </button>
                            ))}
                          </div>
                  
             </div>
                      ))}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
      
                         <Button onClick={handleApplyTagSelection}>Done</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
 
             </aside>
          <div className="lg:col-span-3">
            {searchLoading ?
 (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
              </div>
            ) : searchResults && searchResults.length > 0 ?
 (
              <div className="space-y-6">
                <p className="text-muted-foreground">{searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found {filters.query && ` for "${filters.query}"`}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {searchResults.map((article) => (<ArticleCard key={article.id} article={article} showGroup={true} pastelColor={getColorFromId(article.id)} />))}
           
           </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/20 rounded-lg h-full flex flex-col justify-center">
                <h3 className="text-lg font-semibold text-foreground mb-2">{filters.query ? 'No results found' : 'Start a search'}</h3>
                <p 
 className="text-muted-foreground">{filters.query ? 'Try adjusting your search terms.' : 'Use the search bar above to find articles.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </KnowledgeLayout>
  );
}