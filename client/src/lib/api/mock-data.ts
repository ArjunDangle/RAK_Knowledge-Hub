import { Tag, Group, GroupInfo, Subsection, Article, UpdateEntry } from '../types/content';

export const mockTags: Tag[] = [
  { id: '1', name: 'Getting Started', slug: 'getting-started' },
  { id: '2', name: 'Advanced', slug: 'advanced' },
  { id: '3', name: 'Troubleshooting', slug: 'troubleshooting' },
  { id: '4', name: 'Configuration', slug: 'configuration' },
  { id: '5', name: 'API', slug: 'api' },
  { id: '6', name: 'Hardware', slug: 'hardware' },
  { id: '7', name: 'Software', slug: 'software' },
  { id: '8', name: 'Best Practices', slug: 'best-practices' },
  { id: '9', name: 'Security', slug: 'security' },
  { id: '10', name: 'Performance', slug: 'performance' },
];

export const groupsInfo: GroupInfo[] = [
  {
    id: 'departments',
    title: 'Departments',
    description: 'Resources organized by department and team functions',
    icon: 'Building2'
  },
  {
    id: 'resource-centre',
    title: 'Resource Centre',
    description: 'Comprehensive knowledge base and documentation',
    icon: 'BookOpen'
  },
  {
    id: 'tools',
    title: 'Tools',
    description: 'Development tools, utilities, and platform guides',
    icon: 'Wrench'
  }
];

export const mockSubsections: Subsection[] = [
  // Departments
  {
    id: 'customer-support',
    slug: 'customer-support',
    title: 'Customer Support',
    description: 'Help desk procedures, escalation guides, and customer service protocols',
    group: 'departments',
    tags: [mockTags[0], mockTags[3]],
    hasChildren: false,
    childCount: 0,
    articleCount: 12,
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'sales-management',
    slug: 'sales-management',
    title: 'Sales & Management',
    description: 'Sales processes, management guidelines, and business operations',
    group: 'departments',
    tags: [mockTags[7], mockTags[3]],
    hasChildren: false,
    childCount: 0,
    articleCount: 8,
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: 'research-development',
    slug: 'research-development',
    title: 'Research & Development',
    description: 'R&D processes, innovation guidelines, and technical research',
    group: 'departments',
    tags: [mockTags[1], mockTags[6]],
    hasChildren: false,
    childCount: 0,
    articleCount: 15,
    updatedAt: '2024-01-18T09:15:00Z'
  },
  {
    id: 'it-devops',
    slug: 'it-devops',
    title: 'IT & DevOps',
    description: 'Infrastructure management, deployment guides, and system administration',
    group: 'departments',
    tags: [mockTags[8], mockTags[9]],
    hasChildren: false,
    childCount: 0,
    articleCount: 22,
    updatedAt: '2024-01-22T16:45:00Z'
  },

  // Resource Centre
  {
    id: 'new-hire',
    slug: 'new-hire',
    title: 'New Hire',
    description: 'Onboarding materials, company policies, and getting started guides',
    group: 'resource-centre',
    tags: [mockTags[0], mockTags[7]],
    hasChildren: false,
    childCount: 0,
    articleCount: 18,
    updatedAt: '2024-01-10T11:20:00Z'
  },
  {
    id: 'technical-support',
    slug: 'technical-support',
    title: 'Technical Support',
    description: 'Technical documentation, troubleshooting guides, and support resources',
    group: 'resource-centre',
    tags: [mockTags[2], mockTags[5]],
    hasChildren: false,
    childCount: 0,
    articleCount: 35,
    updatedAt: '2024-01-25T13:10:00Z'
  },
  {
    id: 'case-studies',
    slug: 'case-studies',
    title: 'Case Studies',
    description: 'Real-world implementations, success stories, and project examples',
    group: 'resource-centre',
    tags: [mockTags[7], mockTags[1]],
    hasChildren: false,
    childCount: 0,
    articleCount: 9,
    updatedAt: '2024-01-12T08:30:00Z'
  },
  {
    id: 'user-manual',
    slug: 'user-manual',
    title: 'User Manual',
    description: 'Product manuals, user guides, and step-by-step instructions',
    group: 'resource-centre',
    tags: [mockTags[0], mockTags[3]],
    hasChildren: false,
    childCount: 0,
    articleCount: 28,
    updatedAt: '2024-01-24T15:55:00Z'
  },

  // Tools
  {
    id: 'web-development',
    slug: 'web-development',
    title: 'Web Development',
    description: 'Frontend and backend development tools, frameworks, and libraries',
    group: 'tools',
    tags: [mockTags[4], mockTags[6]],
    hasChildren: false,
    childCount: 0,
    articleCount: 16,
    updatedAt: '2024-01-21T12:40:00Z'
  },
  {
    id: 'management',
    slug: 'management',
    title: 'Management',
    description: 'Project management tools, workflow systems, and productivity apps',
    group: 'tools',
    tags: [mockTags[7], mockTags[9]],
    hasChildren: false,
    childCount: 0,
    articleCount: 11,
    updatedAt: '2024-01-19T10:25:00Z'
  },
  {
    id: 'analytics',
    slug: 'analytics',
    title: 'Analytics',
    description: 'Data analysis tools, reporting systems, and business intelligence',
    group: 'tools',
    tags: [mockTags[1], mockTags[9]],
    hasChildren: false,
    childCount: 0,
    articleCount: 14,
    updatedAt: '2024-01-23T14:15:00Z'
  }
];

export const mockArticles: Article[] = [
  {
    id: 'getting-started-support',
    slug: 'getting-started-support',
    title: 'Getting Started with Customer Support',
    excerpt: 'Learn the fundamentals of our customer support system, including ticket management and escalation procedures.',
    html: `<h2>Overview</h2><p>This guide covers the essential processes for new customer support team members...</p>`,
    tags: [mockTags[0], mockTags[3]],
    group: 'departments',
    subsection: 'customer-support',
    updatedAt: '2024-01-15T10:00:00Z',
    views: 145,
    readMinutes: 8,
    author: 'Sarah Johnson'
  },
  {
    id: 'kubernetes-basics',
    slug: 'kubernetes-basics',
    title: 'Kubernetes Deployment Basics',
    excerpt: 'Essential Kubernetes concepts and deployment strategies for container orchestration.',
    html: `<h2>Introduction to Kubernetes</h2><p>Kubernetes is a powerful orchestration platform...</p>`,
    tags: [mockTags[1], mockTags[8]],
    group: 'departments',
    subsection: 'it-devops',
    updatedAt: '2024-01-22T16:45:00Z',
    views: 289,
    readMinutes: 12,
    author: 'Alex Chen'
  },
  {
    id: 'api-authentication',
    slug: 'api-authentication',
    title: 'API Authentication Methods',
    excerpt: 'Comprehensive guide to implementing secure API authentication in your applications.',
    html: `<h2>Authentication Overview</h2><p>Securing your APIs is crucial for protecting user data...</p>`,
    tags: [mockTags[4], mockTags[8]],
    group: 'resource-centre',
    subsection: 'technical-support',
    updatedAt: '2024-01-25T13:10:00Z',
    views: 412,
    readMinutes: 15,
    author: 'Michael Torres'
  },
  {
    id: 'react-best-practices',
    slug: 'react-best-practices',
    title: 'React Development Best Practices',
    excerpt: 'Modern React patterns, performance optimization, and code organization strategies.',
    html: `<h2>React Development Guidelines</h2><p>Following best practices ensures maintainable code...</p>`,
    tags: [mockTags[6], mockTags[7]],
    group: 'tools',
    subsection: 'web-development',
    updatedAt: '2024-01-21T12:40:00Z',
    views: 324,
    readMinutes: 18,
    author: 'Emily Rodriguez'
  },
  {
    id: 'onboarding-checklist',
    slug: 'onboarding-checklist',
    title: 'New Employee Onboarding Checklist',
    excerpt: 'Complete checklist for new hire onboarding, including IT setup and training resources.',
    html: `<h2>Welcome to RAKwireless</h2><p>This checklist will guide you through your first week...</p>`,
    tags: [mockTags[0], mockTags[7]],
    group: 'resource-centre',
    subsection: 'new-hire',
    updatedAt: '2024-01-10T11:20:00Z',
    views: 156,
    readMinutes: 6,
    author: 'David Kim'
  }
];

export const mockUpdates: UpdateEntry[] = [
  {
    id: '1',
    type: 'new',
    title: 'New Kubernetes Deployment Guide',
    summary: 'Added comprehensive guide for Kubernetes container orchestration',
    date: '2024-01-22T16:45:00Z',
    articleSlug: 'kubernetes-basics',
    group: 'departments'
  },
  {
    id: '2',
    type: 'update',
    title: 'Updated API Authentication Documentation',
    summary: 'Enhanced security guidelines and added new OAuth examples',
    date: '2024-01-25T13:10:00Z',
    articleSlug: 'api-authentication',
    group: 'resource-centre'
  },
  {
    id: '3',
    type: 'announcement',
    title: 'Knowledge Hub Beta Launch',
    summary: 'Introducing our new centralized knowledge management system',
    date: '2024-01-26T09:00:00Z',
    group: 'departments'
  }
];