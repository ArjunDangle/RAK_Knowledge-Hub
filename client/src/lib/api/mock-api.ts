import { SearchFilters, SearchResult, Article, Subsection, UpdateEntry, Group } from '../types/content';
import { mockTags, mockSubsections, mockArticles, mockUpdates, groupsInfo } from './mock-data';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getGroups() {
  await delay(200);
  return groupsInfo;
}

export async function getSubsectionsByGroup(group: Group) {
  await delay(300);
  return mockSubsections.filter(s => s.group === group);
}

export async function getSubsection(slug: string) {
  await delay(200);
  return mockSubsections.find(s => s.slug === slug) || null;
}

export async function getArticlesBySubsection(subsectionSlug: string) {
  await delay(300);
  return mockArticles.filter(a => a.subsection === subsectionSlug);
}

export async function getArticle(slug: string) {
  await delay(200);
  return mockArticles.find(a => a.slug === slug) || null;
}

export async function getPopularArticles(limit = 6) {
  await delay(250);
  return mockArticles
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export async function getRecentArticles(limit = 6) {
  await delay(250);
  return mockArticles
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, limit);
}

export async function getRelatedArticles(tags: string[], currentSlug: string, limit = 4) {
  await delay(200);
  return mockArticles
    .filter(a => a.slug !== currentSlug)
    .filter(a => a.tags.some(tag => tags.includes(tag.id)))
    .sort((a, b) => {
      const aMatches = a.tags.filter(tag => tags.includes(tag.id)).length;
      const bMatches = b.tags.filter(tag => tags.includes(tag.id)).length;
      return bMatches - aMatches;
    })
    .slice(0, limit);
}

export async function searchContent(filters: SearchFilters): Promise<SearchResult[]> {
  await delay(400);
  
  const { query, mode, tags, groups, sort } = filters;
  let results: SearchResult[] = [];
  
  // Search articles
  const articleResults = mockArticles
    .filter(article => {
      // Group filter
      if (groups.length > 0 && !groups.includes(article.group)) return false;
      
      // Tag filter
      if (tags.length > 0 && !article.tags.some(tag => tags.includes(tag.id))) return false;
      
      // Query filter based on mode
      if (!query) return true;
      
      const searchQuery = query.toLowerCase();
      
      switch (mode) {
        case 'title':
          return article.title.toLowerCase().includes(searchQuery);
        case 'tags':
          return article.tags.some(tag => tag.name.toLowerCase().includes(searchQuery));
        case 'content':
          return article.html.toLowerCase().includes(searchQuery) || 
                 article.excerpt.toLowerCase().includes(searchQuery);
        case 'all':
        default:
          return article.title.toLowerCase().includes(searchQuery) ||
                 article.excerpt.toLowerCase().includes(searchQuery) ||
                 article.html.toLowerCase().includes(searchQuery) ||
                 article.tags.some(tag => tag.name.toLowerCase().includes(searchQuery));
      }
    })
    .map(article => ({
      type: 'article' as const,
      item: article,
      matchType: getMatchType(article, query, mode),
      snippet: generateSnippet(article.excerpt, query)
    }));
  
  // Search subsections
  const subsectionResults = mockSubsections
    .filter(subsection => {
      if (groups.length > 0 && !groups.includes(subsection.group)) return false;
      if (tags.length > 0 && !subsection.tags.some(tag => tags.includes(tag.id))) return false;
      
      if (!query) return true;
      
      const searchQuery = query.toLowerCase();
      return subsection.title.toLowerCase().includes(searchQuery) ||
             subsection.description.toLowerCase().includes(searchQuery);
    })
    .map(subsection => ({
      type: 'subsection' as const,
      item: subsection,
      matchType: 'title' as const,
      snippet: generateSnippet(subsection.description, query)
    }));
  
  results = [...articleResults, ...subsectionResults];
  
  // Sort results
  switch (sort) {
    case 'date':
      results.sort((a, b) => new Date(b.item.updatedAt).getTime() - new Date(a.item.updatedAt).getTime());
      break;
    case 'views':
      results.sort((a, b) => {
        const aViews = a.type === 'article' ? (a.item as Article).views : 0;
        const bViews = b.type === 'article' ? (b.item as Article).views : 0;
        return bViews - aViews;
      });
      break;
    case 'relevance':
    default:
      // Already sorted by relevance
      break;
  }
  
  return results;
}

export async function getWhatsNew() {
  await delay(300);
  return mockUpdates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getAllTags() {
  await delay(150);
  return mockTags;
}

function getMatchType(article: Article, query: string, mode: string): 'title' | 'content' | 'tag' {
  if (!query) return 'title';
  
  const searchQuery = query.toLowerCase();
  
  if (article.title.toLowerCase().includes(searchQuery)) return 'title';
  if (article.tags.some(tag => tag.name.toLowerCase().includes(searchQuery))) return 'tag';
  return 'content';
}

function generateSnippet(text: string, query: string): string {
  if (!query) return text.substring(0, 150) + '...';
  
  const searchQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(searchQuery);
  
  if (index === -1) return text.substring(0, 150) + '...';
  
  const start = Math.max(0, index - 50);
  const end = Math.min(text.length, index + query.length + 100);
  
  return (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
}