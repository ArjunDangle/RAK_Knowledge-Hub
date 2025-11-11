// client/src/lib/types/content.ts

export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type Group = string;

export type GroupInfo = {
  id: Group;
  title: string;
  description: string;
  icon: string;
};

export type Subsection = {
  type: 'subsection';
  id: string;
  slug: string;
  title: string;
  description: string;
  html: string;
  group: Group;
  tags: Tag[];
  articleCount: number;
  updatedAt: string;
};

export type Article = {
  type: 'article';
  id: string;
  slug: string;
  title: string;
  description: string; // <-- STEP 3: Field added
  excerpt: string; // Kept for compatibility, but description is preferred
  html: string;
  tags: Tag[];
  group: Group;
  subsection: string;
  updatedAt: string;
  views: number;
  readMinutes: number;
  author?: string;
  parentId: string | null;
};

// NEW: This type allows us to handle a mixed list of articles and subsections
export type ContentItem = Subsection | Article;

// --- STEP 4.1: PAGINATION TYPE ADDED ---
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}
// --- END OF ADDED TYPE ---

export type SearchMode = 'all' | 'title' | 'tags' | 'content';

export type SearchResult = {
  type: 'article' | 'subsection';
  item: Article | Subsection;
  matchType: 'title' | 'content' | 'tag';
  snippet?: string;
  highlights?: string[];
};

export type SearchFilters = {
  query: string;
  mode: SearchMode;
  tags: string[];
  groups: Group[];
  sort: 'relevance' | 'date' | 'views';
  // Pagination will be handled by the query function
};

export type UpdateEntry = {
  id: string;
  type: 'new' | 'update' | 'announcement';
  title: string;
  summary: string;
  date: string;
  articleSlug?: string;
  group?: Group;
};

export type PageTreeNode = {
  id: string;
  title: string;
  hasChildren: boolean;
};

export interface PageTreeNodeWithPermission extends PageTreeNode {
  isAllowed: boolean;
}