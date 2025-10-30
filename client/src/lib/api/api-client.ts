// client/src/lib/api/api-client.ts
import { SearchFilters, Article, Subsection, UpdateEntry, Group, Tag, GroupInfo, ContentItem, PageTreeNode } from '../types/content';

// This interface now matches our backend User model, including the new 'name' field
interface User {
  id: number;
  username: string;
  name: string;
  role: 'MEMBER' | 'ADMIN';
}

// This is updated to expect the full user object on login
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AttachmentUploadResponse {
    temp_id: string;
    file_name: string;
}
export interface AttachmentInfo {
    temp_id: string;
    file_name: string;
}
export interface PageCreatePayload {
    title: string;
    content: string; // This will now be rich HTML
    parent_id: string;
    tags: string[];
    attachments: AttachmentInfo[];
}

export interface RejectPayload {
  comment?: string;
}

// --- NEW TYPES FOR PHASE 3 ---
export type ArticleSubmissionStatus = "PENDING_REVIEW" | "REJECTED" | "PUBLISHED";

export interface ArticleSubmission {
  id: number;
  confluencePageId: string;
  title: string;
  status: ArticleSubmissionStatus;
  updatedAt: string;
}

// --- NEW TYPE FOR INDEX PAGE ---
export interface ContentNode {
  id: string;
  title: string;
  author: string | null;
  status: ArticleSubmissionStatus;
  updatedAt: string;
  confluenceUrl: string;
  children: ContentNode[];
}
// -----------------------------

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Network response was not ok' }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }
  if (response.status === 204) { return null as T; }
  return response.json();
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...options.headers };
  if (token) { headers['Authorization'] = `Bearer ${token}`; }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
  return handleResponse(response);
}

// --- AUTH FUNCTIONS ---
export async function loginUser(credentials: any): Promise<LoginResponse> {
  const formBody = new URLSearchParams();
  formBody.append('username', credentials.username);
  formBody.append('password', credentials.password);
  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formBody.toString(),
  });
  return handleResponse<LoginResponse>(response);
}

// --- KNOWLEDGE HUB FUNCTIONS ---
export async function getGroups(): Promise<GroupInfo[]> { return apiFetch<GroupInfo[]>('/groups'); }
export async function getSubsectionsByGroup(group: Group): Promise<Subsection[]> { return apiFetch<Subsection[]>(`/subsections/${group}`); }
export async function getPageContents(parentId: string): Promise<ContentItem[]> { return apiFetch<ContentItem[]>(`/contents/by-parent/${parentId}`); }
export async function getArticleById(pageId: string): Promise<Article | null> { return apiFetch<Article | null>(`/article/${pageId}`); }
export async function getPageById(pageId: string): Promise<Subsection> { return apiFetch<Subsection>(`/page/${pageId}`); }
export async function getPopularArticles(limit = 6): Promise<Article[]> { return apiFetch<Article[]>(`/articles/popular?limit=${limit}`); }
export async function getRecentArticles(limit = 6): Promise<Article[]> { return apiFetch<Article[]>(`/articles/recent?limit=${limit}`); }
export async function getAllTags(): Promise<Tag[]> { return apiFetch<Tag[]>('/tags'); }
export async function getAncestors(pageId: string): Promise<{ id: string; title: string }[]> {
  if (!pageId) return [];
  return apiFetch<{ id: string; title: string }[]>(`/ancestors/${pageId}`);
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
  return articles.map(article => ({ id: article.id, type: 'update', title: article.title, summary: article.excerpt, date: article.updatedAt, articleSlug: article.slug, group: article.group as Group }));
}

// --- CMS & ADMIN FUNCTIONS ---
export async function getArticleForPreview(pageId: string): Promise<Article | null> {
    return apiFetch<Article | null>(`/cms/admin/preview/${pageId}`);
}

// --- NEW FUNCTION FOR PHASE 3 ---
export async function getMySubmissions(): Promise<ArticleSubmission[]> {
  return apiFetch('/cms/my-submissions');
}

export async function getContentIndex(): Promise<ContentNode[]> {
  return apiFetch('/cms/admin/content-index');
}

export async function getAllSubsections(): Promise<Subsection[]> {
    const groups: Group[] = ['departments', 'resource-centre', 'tools'];
    const promises = groups.map(group => getSubsectionsByGroup(group));
    const results = await Promise.all(promises);
    return results.flat();
}

export async function getPageTree(parentId?: string): Promise<PageTreeNode[]> {
    const endpoint = parentId ? `/cms/pages/tree?parent_id=${parentId}` : '/cms/pages/tree';
    return apiFetch<PageTreeNode[]>(endpoint);
}

export async function uploadAttachment(file: File): Promise<AttachmentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/cms/attachments/upload`, {
        method: 'POST',
        headers,
        body: formData,
    });
    return handleResponse<AttachmentUploadResponse>(response);
}

export async function createPage(payload: PageCreatePayload) {
    return apiFetch('/cms/pages/create', {
        method: 'POST',
        body: JSON.stringify(payload)
    });
}

export async function getPendingArticles(): Promise<Article[]> { return apiFetch('/cms/admin/pending'); }
export async function approveArticle(pageId: string): Promise<void> { return apiFetch(`/cms/admin/pages/${pageId}/approve`, { method: 'POST' }); }
export async function rejectArticle(pageId: string, payload: RejectPayload): Promise<void> { 
  return apiFetch(`/cms/admin/pages/${pageId}/reject`, { 
    method: 'POST',
    body: JSON.stringify(payload) 
  }); 
}

export async function resubmitArticle(pageId: string): Promise<void> {
  return apiFetch(`/cms/pages/${pageId}/resubmit`, { method: 'POST' });
}