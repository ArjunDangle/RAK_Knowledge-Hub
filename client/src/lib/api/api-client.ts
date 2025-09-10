import { SearchFilters, Article, Subsection, UpdateEntry, Group, Tag, GroupInfo, ContentItem } from '../types/content';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network response was not ok' }));
    throw new Error(error.detail || 'An unknown error occurred');
  }
  return response.json();
}

export async function getGroups(): Promise<GroupInfo[]> {
  const response = await fetch(`${API_BASE_URL}/groups`);
  return handleResponse<GroupInfo[]>(response);
}

export async function getSubsectionsByGroup(group: Group): Promise<Subsection[]> {
  const response = await fetch(`${API_BASE_URL}/subsections/${group}`);
  return handleResponse<Subsection[]>(response);
}

export async function getPageContents(parentId: string): Promise<ContentItem[]> {
  const response = await fetch(`${API_BASE_URL}/contents/by-parent/${parentId}`);
  return handleResponse<ContentItem[]>(response);
}

// --- REPLACED SLUG FUNCTION WITH ID FUNCTION ---
export async function getArticleById(pageId: string): Promise<Article | null> {
  const response = await fetch(`${API_BASE_URL}/article/${pageId}`);
  if (response.status === 404) return null;
  return handleResponse<Article>(response);
}

// --- REPLACED SLUG FUNCTION WITH ID FUNCTION ---
export async function getPageById(pageId: string): Promise<Subsection> {
  const response = await fetch(`${API_BASE_URL}/page/${pageId}`);
  return handleResponse<Subsection>(response);
}

export async function getPopularArticles(limit = 6): Promise<Article[]> {
  const response = await fetch(`${API_BASE_URL}/articles/popular?limit=${limit}`);
  return handleResponse<Article[]>(response);
}

export async function getRecentArticles(limit = 6): Promise<Article[]> {
  const response = await fetch(`${API_BASE_URL}/articles/recent?limit=${limit}`);
  return handleResponse<Article[]>(response);
}

export async function getRelatedArticles(tags: Tag[], currentId: string, limit = 4): Promise<Article[]> {
  const tagNames = tags.map(t => t.name).slice(0, 5);
  // Use first 5 tags for relevance
  if (tagNames.length === 0) return [];
  
  const searchParams = new URLSearchParams();
  tagNames.forEach(tag => searchParams.append('tags', tag));
  
  const response = await fetch(`${API_BASE_URL}/search?q=${tagNames.join(' ')}&${searchParams.toString()}`);
  const allArticles = await handleResponse<Article[]>(response);
  return allArticles.filter(a => a.id !== currentId).slice(0, limit);
}

export async function searchContent(filters: SearchFilters): Promise<Article[]> {
  const params = new URLSearchParams();
  if (filters.query) params.append('q', filters.query);
  
  // MODIFIED: Ensure the 'mode' parameter is always included in the API call
  if (filters.mode) params.append('mode', filters.mode);
  filters.tags.forEach(tag => params.append('tags', tag));
  if (filters.sort !== 'relevance') params.set('sort', filters.sort);

  const response = await fetch(`${API_BASE_URL}/search?${params.toString()}`);
  return handleResponse<Article[]>(response);
}

export async function getWhatsNew(): Promise<UpdateEntry[]> {
  const response = await fetch(`${API_BASE_URL}/whats-new`);
  const articles = await handleResponse<Article[]>(response);
  return articles.map(article => ({
    id: article.id,
    type: 'update',
    title: article.title,
    summary: article.excerpt,
    date: article.updatedAt,
    articleSlug: article.slug, // Slug can still be used for display/context if needed
    group: article.group as Group
  }));
}

export async function getAllTags(): Promise<Tag[]> {
  const response = await fetch(`${API_BASE_URL}/tags`);
  return handleResponse<Tag[]>(response);
}

export async function getAncestors(pageId: string): Promise<{ id: string; title: string }[]> {
  if (!pageId) return [];
  const response = await fetch(`${API_BASE_URL}/ancestors/${pageId}`);
  return handleResponse<{ id: string; title: string }[]>(response);
}