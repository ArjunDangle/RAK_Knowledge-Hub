// client/src/lib/api/api-client.ts
import {
  SearchFilters,
  Article,
  Subsection,
  UpdateEntry,
  Group,
  Tag, // Now correctly imported from the central file
  TagGroup, // New
  GroupedTag, // New
  GroupInfo,
  ContentItem,
  PageTreeNode,
  PaginatedResponse,
  PageTreeNodeWithPermission,
} from "../types/content";

export type GroupRole = 'MEMBER' | 'ADMIN';

export interface GroupMembership {
  groupId: number;
  role: GroupRole;
  group: {
    id: number;
    name: string;
    managedPage: {
      id: number;
      confluenceId: string;
      title: string;
    } | null;
  };
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: "MEMBER" | "ADMIN";
  groupMemberships: GroupMembership[];
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User; // <-- This now correctly uses the updated User type
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
  description: string;
  content: string;
  parent_id: string;
  tags: string[];
  attachments: AttachmentInfo[];
}

export interface PageCreateResponse {
  id: string;
  title: string;
  status: string;
}

export interface PageDetailResponse {
  title: string;
  description: string;
  content: string;
  parent_id: string | null;
  tags: string[];
}

// client/src/lib/api/api-client.ts

export interface PageUpdatePayload {
  title: string;
  description: string;
  content: string;
  parent_id?: string;
  tags?: string[];
  attachments?: AttachmentInfo[];
}
export interface RejectPayload {
  comment?: string;
}

export type ArticleSubmissionStatus =
  | "PENDING_REVIEW"
  | "REJECTED"
  | "PUBLISHED";

export interface ArticleSubmission {
  id: number;
  confluencePageId: string;
  title: string;
  status: ArticleSubmissionStatus;
  rejectionComment?: string | null;
  updatedAt: string;
}

export interface ContentNode {
  id: string;
  title: string;
  author: string | null;
  status: ArticleSubmissionStatus;
  updatedAt: string;
  confluenceUrl: string;
  children: ContentNode[];
  hasChildren: boolean;
}

export interface Notification {
  id: number;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface PermissionGroup {
  id: number;
  name: string;
  managedPageConfluenceId: string | null;
  members: User[]; 
}

export interface GroupUpdatePayload {
  name: string;
  managedPageConfluenceId: string | null;
}

export interface TagGroupCreatePayload {
  name: string;
  description?: string;
}

export interface TagCreatePayload {
  name: string;
  tagGroupId: number;
}

export interface TagBulkCreatePayload {
  tagGroupId: number;
  names: string[];
}

export interface UserCreatePayload {
  username: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'MEMBER';
}

interface ApiError extends Error {
  status?: number;
}

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: "An unexpected API error occurred." }));
    
    const error: ApiError = new Error(errorBody.detail || `HTTP error! status: ${response.status}`);
    
    error.status = response.status;
    
    throw error;
  }
  if (response.status === 204) {
    return null as T;
  }
  return response.json();
}

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  return handleResponse(response);
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export async function loginUser(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const formBody = new URLSearchParams();
  formBody.append("username", credentials.username);
  formBody.append("password", credentials.password);
  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody.toString(),
  });
  return handleResponse<LoginResponse>(response);
}

// --- KNOWLEDGE HUB FUNCTIONS (no changes) ---
export async function getGroups(): Promise<GroupInfo[]> {
  return apiFetch<GroupInfo[]>("/groups");
}
export async function getSubsectionsByGroup(
  group: Group
): Promise<Subsection[]> {
  return apiFetch<Subsection[]>(`/subsections/${group}`);
}
export async function getPageContents(
  parentId: string,
  page: number = 1
): Promise<PaginatedResponse<ContentItem>> {
  return apiFetch<PaginatedResponse<ContentItem>>(
    `/contents/by-parent/${parentId}?page=${page}&pageSize=10`
  );
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
export async function getAllTags(): Promise<Tag[]> {
  return apiFetch<Tag[]>("/tags");
}
export async function getAncestors(
  pageId: string
): Promise<{ id: string; title: string }[]> {
  if (!pageId) return [];
  return apiFetch<{ id: string; title: string }[]>(`/ancestors/${pageId}`);
}
export async function getRelatedArticles(
  tags: Tag[],
  currentId: string,
  limit = 4
): Promise<Article[]> {
  const tagNames = tags.map((t) => t.name).slice(0, 5);
  if (tagNames.length === 0) return [];
  const searchParams = new URLSearchParams();
  tagNames.forEach((tag) => searchParams.append("tags", tag));
  const allArticles = await apiFetch<Article[]>(
    `/search?q=${tagNames.join(" ")}`
  );
  return allArticles.filter((a) => a.id !== currentId).slice(0, limit);
}
export async function searchContent(
  filters: SearchFilters,
  page: number = 1
): Promise<PaginatedResponse<Article>> {
  const params = new URLSearchParams();
  if (filters.query) params.append("q", filters.query);
  if (filters.mode) params.append("mode", filters.mode);
  filters.tags.forEach((tag) => params.append("tags", tag));
  if (filters.sort !== "relevance") params.set("sort", filters.sort);

  params.append("page", page.toString());
  params.append("pageSize", "10");

  return apiFetch<PaginatedResponse<Article>>(`/search?${params.toString()}`);
}
export async function getWhatsNew(): Promise<UpdateEntry[]> {
  const articles = await apiFetch<Article[]>(`/whats-new`);
  return articles.map((article) => ({
    id: article.id,
    type: "update",
    title: article.title,
    summary: article.description || article.excerpt,
    date: article.updatedAt,
    articleSlug: article.slug,
    group: article.group as Group,
  }));
}

// --- CMS & ADMIN FUNCTIONS (no changes) ---
export async function getPageDetailsForEdit(
  pageId: string
): Promise<PageDetailResponse> {
  return apiFetch<PageDetailResponse>(`/cms/admin/edit-details/${pageId}`);
}
export async function getArticleForPreview(
  pageId: string
): Promise<Article | null> {
  return apiFetch<Article | null>(`/cms/admin/preview/${pageId}`);
}
export async function getNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>("/notifications");
}
export async function markAllNotificationsAsRead(): Promise<void> {
  return apiFetch<void>("/notifications/read-all", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
export async function getMySubmissions(): Promise<ArticleSubmission[]> {
  return apiFetch("/cms/my-submissions");
}
export async function getContentIndex(
  parentId?: string
): Promise<ContentNode[]> {
  const endpoint = parentId
    ? `/cms/admin/content-index?parent_id=${parentId}`
    : "/cms/admin/content-index";
  return apiFetch(endpoint);
}
export async function getAllSubsections(): Promise<Subsection[]> {
  const groups: Group[] = ["departments", "resource-centre", "tools"];
  const promises = groups.map((group) => getSubsectionsByGroup(group));
  const results = await Promise.all(promises);
  return results.flat();
}
export async function getPageTree(parentId?: string): Promise<PageTreeNode[]> {
  const endpoint = parentId
    ? `/cms/pages/tree?parent_id=${parentId}`
    : "/cms/pages/tree";
  return apiFetch<PageTreeNode[]>(endpoint);
}
export async function getPageTreeWithPermissions(
  parentId?: string,
  allowedOnly: boolean = false
): Promise<PageTreeNodeWithPermission[]> {
  const params = new URLSearchParams();
  if (parentId) {
    params.append("parent_id", parentId);
  }
  if (allowedOnly) {
    params.append("allowed_only", "true");
  }
  const endpoint = `/cms/pages/tree-with-permissions?${params.toString()}`;
  return apiFetch<PageTreeNodeWithPermission[]>(endpoint);
}
export async function uploadAttachment(
  file: File
): Promise<AttachmentUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const token = localStorage.getItem("authToken");
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}/cms/attachments/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  return handleResponse<AttachmentUploadResponse>(response);
}
export async function createPage(
  payload: PageCreatePayload
): Promise<PageCreateResponse> {
  return apiFetch<PageCreateResponse>("/cms/pages/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export async function updatePage(pageId: string, payload: PageUpdatePayload) {
  return apiFetch(`/cms/pages/update/${pageId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export async function getPendingArticles(): Promise<Article[]> {
  return apiFetch("/cms/admin/pending");
}
export async function approveArticle(pageId: string): Promise<void> {
  return apiFetch(`/cms/admin/pages/${pageId}/approve`, { method: "POST" });
}
export async function rejectArticle(
  pageId: string,
  payload: RejectPayload
): Promise<void> {
  return apiFetch(`/cms/admin/pages/${pageId}/reject`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export async function resubmitArticle(pageId: string): Promise<void> {
  return apiFetch(`/cms/pages/${pageId}/resubmit`, { method: "POST" });
}
export async function deletePage(pageId: string): Promise<void> {
  return apiFetch(`/cms/admin/pages/${pageId}`, { method: "DELETE" });
}
export async function searchContentIndex(
  query: string
): Promise<ContentNode[]> {
  if (query.length < 2) return [];
  return apiFetch<ContentNode[]>(
    `/cms/admin/content-index/search?query=${encodeURIComponent(query)}`
  );
}

// --- MODIFIED GROUP MANAGEMENT FUNCTIONS ---
export async function getAllGroups(): Promise<PermissionGroup[]> {
  return apiFetch("/api/groups");
}
export async function createGroup(name: string): Promise<PermissionGroup> {
  return apiFetch("/api/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}
export async function updateGroup(
  groupId: number,
  payload: GroupUpdatePayload
): Promise<PermissionGroup> {
  return apiFetch(`/api/groups/${groupId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
export async function deleteGroup(groupId: number): Promise<void> {
  return apiFetch(`/api/groups/${groupId}`, { method: "DELETE" });
}
export async function addMemberToGroup(
  groupId: number,
  userId: number
): Promise<PermissionGroup> {
  return apiFetch(`/api/groups/${groupId}/members/${userId}`, {
    method: "POST",
  });
}
export async function removeMemberFromGroup(
  groupId: number,
  userId: number
): Promise<PermissionGroup> {
  return apiFetch(`/api/groups/${groupId}/members/${userId}`, {
    method: "DELETE",
  });
}
export async function getAllUsers(): Promise<User[]> {
  return apiFetch("/api/groups/users/all");
}
export async function getAllTagGroupsWithTagsAdmin(): Promise<GroupedTag[]> {
  return apiFetch("/api/tags/groups/with-tags");
}

export async function getAllTagsGrouped(): Promise<GroupedTag[]> {
  return apiFetch("/api/tags/grouped");
}

export async function createTagGroup(
  payload: TagGroupCreatePayload
): Promise<TagGroup> {
  return apiFetch("/api/tags/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteTagGroup(groupId: number): Promise<void> {
  return apiFetch(`/api/tags/groups/${groupId}`, { method: "DELETE" });
}

export async function createTag(payload: TagCreatePayload): Promise<Tag> {
  return apiFetch("/api/tags", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deleteTag(tagId: number): Promise<void> {
  return apiFetch(`/api/tags/${tagId}`, { method: "DELETE" });
}

export async function createTagsInBulk(payload: TagBulkCreatePayload): Promise<{ message: string }> {
  return apiFetch("/api/tags/bulk", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerUserByAdmin(payload: UserCreatePayload): Promise<User> {
  return apiFetch<User>("/auth/admin/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
export async function getAdminUsers(): Promise<User[]> {
  return apiFetch<User[]>("/auth/users");
}

export async function deleteUser(userId: number): Promise<void> {
  return apiFetch(`/auth/users/${userId}`, { method: "DELETE" });
}

export async function updateUserRole(userId: number, role: "ADMIN" | "MEMBER"): Promise<User> {
  return apiFetch<User>(`/auth/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}

export async function adminResetPassword(userId: number, password: string): Promise<void> {
  return apiFetch(`/auth/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export async function updateGroupMemberRole(
  groupId: number,
  userId: number,
  role: "ADMIN" | "MEMBER"
): Promise<void> {
  return apiFetch(`/api/groups/${groupId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  });
}