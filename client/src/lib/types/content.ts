export type Tag = {
  id: string;
  name: string;
  slug: string;
};

export type Group = 'departments' | 'resource-centre' | 'tools';

export type GroupInfo = {
  id: Group;
  title: string;
  description: string;
  icon: string;
};

export type Subsection = {
  type: 'subsection'; // <-- ADDED THIS
  id: string;
  slug: string;
  title: string;
  description: string;
  group: Group;
  tags: Tag[];
  articleCount: number;
  updatedAt: string;
};

export type Article = {
  type: 'article'; // <-- ADDED THIS
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  html: string;
  tags: Tag[];
  group: Group;
  subsection: string;
  updatedAt: string;
  views: number;
  readMinutes: number;
  author?: string;
};

// NEW: This type allows us to handle a mixed list of articles and subsections
export type ContentItem = Subsection | Article;

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