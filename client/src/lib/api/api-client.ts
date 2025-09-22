// client/src/lib/api/api-client.ts
import { SearchFilters, Article, Subsection, UpdateEntry, Group, Tag, GroupInfo, ContentItem } from '../types/content';

// export const API_BASE_URL = "https://rak-knowledge-hub-backend.onrender.com";
export const API_BASE_URL = "http://127.0.0.1:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network response was not ok' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  return handleResponse(response);
}

// --- AUTH FUNCTIONS ---
export async function loginUser(credentials: any) {
  // Use URLSearchParams to create the x-www-form-urlencoded body
  const formBody = new URLSearchParams();
  formBody.append('username', credentials.username);
  formBody.append('password', credentials.password);

  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: 'POST',
    // Change the Content-Type header
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    // Send the form data instead of JSON
    body: formBody.toString(),
  });
  return handleResponse<any>(response);
}

// --- REFACTORED API FUNCTIONS ---
export async function getGroups(): Promise<GroupInfo[]> {
  return apiFetch<GroupInfo[]>('/groups');
}

export async function getSubsectionsByGroup(group: Group): Promise<Subsection[]> {
  return apiFetch<Subsection[]>(`/subsections/${group}`);
}

export async function getPageContents(parentId: string): Promise<ContentItem[]> {
  return apiFetch<ContentItem[]>(`/contents/by-parent/${parentId}`);
}

export async function getArticleById(pageId: string): Promise<Article | null> {
  return apiFetch<Article | null>(`/article/${pageId}`);
}

export async function getPageById(pageId: string): Promise<Subsection> {
  return apiFetch<Subsection>(`/page/${pageId}`);
}

export async function getPopularArticles(limit = 6): Promise<Article[]> {
  return apiFetch<Article[]>(`/articles/popular?limit=${limit}`);
}

export async function getRecentArticles(limit = 6): Promise<Article[]> {
  return apiFetch<Article[]>(`/articles/recent?limit=${limit}`);
}

export async function getRelatedArticles(tags: Tag[], currentId: string, limit = 4): Promise<Article[]> {
  const tagNames = tags.map(t => t.name).slice(0, 5);
  if (tagNames.length === 0) return [];
  
  const searchParams = new URLSearchParams();
  tagNames.forEach(tag => searchParams.append('tags', tag));
  
  const allArticles = await apiFetch<Article[]>(`/search?q=${tagNames.join(' ')}&${searchParams.toString()}`);
  return allArticles.filter(a => a.id !== currentId).slice(0, limit);
}

export async function searchContent(filters: SearchFilters): Promise<Article[]> {
  const params = new URLSearchParams();
  if (filters.query) params.append('q', filters.query);
  if (filters.mode) params.append('mode', filters.mode);
  filters.tags.forEach(tag => params.append('tags', tag));
  if (filters.sort !== 'relevance') params.set('sort', filters.sort);

  return apiFetch<Article[]>(`/search?${params.toString()}`);
}

export async function getWhatsNew(): Promise<UpdateEntry[]> {
  const articles = await apiFetch<Article[]>(`/whats-new`);
  return articles.map(article => ({
    id: article.id,
    type: 'update',
    title: article.title,
    summary: article.excerpt,
    date: article.updatedAt,
    articleSlug: article.slug,
    group: article.group as Group
  }));
}

export async function getAllTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>(`/tags`);
}

export async function getAncestors(pageId: string): Promise<{ id: string; title: string }[]> {
  if (!pageId) return [];
  return apiFetch<{ id: string; title: string }[]>(`/ancestors/${pageId}`);
}