// Temporary mock data source for the dashboard UI.
// Shapes mirror the Prisma schema in context/project-overview.md so this
// can be swapped for real database queries later without reshaping consumers.

export type ContentType = 'TEXT' | 'FILE' | 'URL';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  isPro: boolean;
}

export interface MockItemType {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
}

export interface MockCollection {
  id: string;
  name: string;
  description: string;
  isFavorite: boolean;
  defaultTypeId: string;
}

export interface MockItem {
  id: string;
  title: string;
  contentType: ContentType;
  content: string | null;
  url: string | null;
  description: string;
  isFavorite: boolean;
  isPinned: boolean;
  language: string | null;
  tags: string[];
  itemTypeId: string;
  collectionIds: string[];
  createdAt: string;
}

export const currentUser: MockUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  image: null,
  isPro: false,
};

export const itemTypes: MockItemType[] = [
  { id: 'type-snippet', name: 'snippet', icon: 'Code', color: '#3b82f6', isSystem: true },
  { id: 'type-prompt', name: 'prompt', icon: 'Sparkles', color: '#8b5cf6', isSystem: true },
  { id: 'type-command', name: 'command', icon: 'Terminal', color: '#f97316', isSystem: true },
  { id: 'type-note', name: 'note', icon: 'StickyNote', color: '#fde047', isSystem: true },
  { id: 'type-file', name: 'file', icon: 'File', color: '#6b7280', isSystem: true },
  { id: 'type-image', name: 'image', icon: 'Image', color: '#ec4899', isSystem: true },
  { id: 'type-link', name: 'link', icon: 'Link', color: '#10b981', isSystem: true },
];

export const collections: MockCollection[] = [
  {
    id: 'col-react-patterns',
    name: 'React Patterns',
    description: 'Common React patterns and hooks',
    isFavorite: true,
    defaultTypeId: 'type-snippet',
  },
  {
    id: 'col-python-snippets',
    name: 'Python Snippets',
    description: 'Useful Python code snippets',
    isFavorite: false,
    defaultTypeId: 'type-snippet',
  },
  {
    id: 'col-context-files',
    name: 'Context Files',
    description: 'AI context files for projects',
    isFavorite: true,
    defaultTypeId: 'type-file',
  },
  {
    id: 'col-interview-prep',
    name: 'Interview Prep',
    description: 'Technical interview preparation',
    isFavorite: false,
    defaultTypeId: 'type-note',
  },
  {
    id: 'col-git-commands',
    name: 'Git Commands',
    description: 'Frequently used git commands',
    isFavorite: true,
    defaultTypeId: 'type-command',
  },
  {
    id: 'col-ai-prompts',
    name: 'AI Prompts',
    description: 'Curated AI prompts for coding',
    isFavorite: false,
    defaultTypeId: 'type-prompt',
  },
];

export const items: MockItem[] = [
  {
    id: 'item-use-auth-hook',
    title: 'useAuth Hook',
    contentType: 'TEXT',
    content: 'export function useAuth() { /* ... */ }',
    url: null,
    description: 'Custom authentication hook for React applications',
    isFavorite: true,
    isPinned: true,
    language: 'typescript',
    tags: ['react', 'auth', 'hooks'],
    itemTypeId: 'type-snippet',
    collectionIds: ['col-react-patterns'],
    createdAt: '2026-01-15',
  },
  {
    id: 'item-api-error-handling',
    title: 'API Error Handling Pattern',
    contentType: 'TEXT',
    content: 'async function fetchWithRetry(url) { /* ... */ }',
    url: null,
    description: 'Fetch wrapper with exponential backoff retry logic',
    isFavorite: false,
    isPinned: true,
    language: 'typescript',
    tags: ['fetch', 'error-handling'],
    itemTypeId: 'type-snippet',
    collectionIds: ['col-react-patterns'],
    createdAt: '2026-01-12',
  },
  {
    id: 'item-code-review-prompt',
    title: 'Code review prompt',
    contentType: 'TEXT',
    content: 'Review this code for bugs, performance, and style issues...',
    url: null,
    description: 'Structured prompt for thorough AI code reviews',
    isFavorite: false,
    isPinned: false,
    language: null,
    tags: ['ai', 'review'],
    itemTypeId: 'type-prompt',
    collectionIds: ['col-ai-prompts'],
    createdAt: '2026-01-10',
  },
  {
    id: 'item-git-reset',
    title: 'git reset --hard HEAD~1',
    contentType: 'TEXT',
    content: 'git reset --hard HEAD~1',
    url: null,
    description: 'Undo the last commit and discard its changes',
    isFavorite: false,
    isPinned: false,
    language: 'bash',
    tags: ['git'],
    itemTypeId: 'type-command',
    collectionIds: ['col-git-commands'],
    createdAt: '2026-01-08',
  },
  {
    id: 'item-list-comprehension',
    title: 'List comprehension cheatsheet',
    contentType: 'TEXT',
    content: 'squares = [x * x for x in range(10)]',
    url: null,
    description: 'Common Python list comprehension examples',
    isFavorite: false,
    isPinned: false,
    language: 'python',
    tags: ['python'],
    itemTypeId: 'type-snippet',
    collectionIds: ['col-python-snippets'],
    createdAt: '2026-01-05',
  },
  {
    id: 'item-interview-bigo',
    title: 'Big O complexity cheatsheet',
    contentType: 'TEXT',
    content: 'O(1) constant, O(log n) logarithmic, O(n) linear...',
    url: null,
    description: 'Quick reference for common time complexities',
    isFavorite: false,
    isPinned: false,
    language: null,
    tags: ['interview', 'algorithms'],
    itemTypeId: 'type-note',
    collectionIds: ['col-interview-prep'],
    createdAt: '2026-01-04',
  },
  {
    id: 'item-project-context',
    title: 'devstash-project-overview.md',
    contentType: 'FILE',
    content: null,
    url: null,
    description: 'Full project context for AI-assisted development',
    isFavorite: false,
    isPinned: false,
    language: null,
    tags: ['context'],
    itemTypeId: 'type-file',
    collectionIds: ['col-context-files'],
    createdAt: '2026-01-03',
  },
  {
    id: 'item-dashboard-mock',
    title: 'dashboard-ui-main.png',
    contentType: 'FILE',
    content: null,
    url: null,
    description: 'Reference screenshot for the dashboard layout',
    isFavorite: false,
    isPinned: false,
    language: null,
    tags: ['design'],
    itemTypeId: 'type-image',
    collectionIds: ['col-context-files'],
    createdAt: '2026-01-02',
  },
  {
    id: 'item-nextjs-docs',
    title: 'Next.js App Router docs',
    contentType: 'URL',
    content: null,
    url: 'https://nextjs.org/docs/app',
    description: 'Official documentation for the App Router',
    isFavorite: true,
    isPinned: false,
    language: null,
    tags: ['nextjs', 'docs'],
    itemTypeId: 'type-link',
    collectionIds: [],
    createdAt: '2026-01-01',
  },
  {
    id: 'item-explain-code-prompt',
    title: 'Explain this code prompt',
    contentType: 'TEXT',
    content: 'Explain what this code does, line by line, for a junior developer...',
    url: null,
    description: 'Prompt for breaking down unfamiliar code',
    isFavorite: false,
    isPinned: false,
    language: null,
    tags: ['ai', 'learning'],
    itemTypeId: 'type-prompt',
    collectionIds: ['col-ai-prompts'],
    createdAt: '2025-12-30',
  },
];
