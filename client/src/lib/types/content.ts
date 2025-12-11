// client/src/lib/types/content.ts

export interface TagGroup {
  id: number;
  name: string;
  description: string | null;
  order: number;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  tagGroupId: number;
}

export interface GroupedTag extends TagGroup {
  tags: Tag[];
}

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
  tags: Tag[]; // This will now use the new Tag type
  articleCount: number;
  updatedAt: string;
};

export type Article = {
  type: 'article';
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  html: string;
  tags: Tag[]; // This will now use the new Tag type
  group: Group;
  subsection: string;
  updatedAt: string;
  views: number;
  readMinutes: number;
  author?: string;
  parentId: string | null;
  canEdit?: boolean;
};

export type ContentItem = Subsection | Article;

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
}

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