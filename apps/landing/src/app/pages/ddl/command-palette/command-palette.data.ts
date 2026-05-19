export type SearchKind = 'page' | 'section' | 'action' | 'project' | 'blog';

export interface SearchResult {
  readonly id: string;
  readonly kind: SearchKind;
  readonly title: string;
  readonly description?: string;
  /** Right-side hint (e.g., keyboard shortcut, route hint). */
  readonly hint?: string;
  /** Lucide icon name. */
  readonly iconName: string;
  /** Optional href — actions may omit (run callback) but for the demo we keep all clickable. */
  readonly href?: string;
}

export const MOCK_RESULTS: readonly SearchResult[] = [
  // ─── Pages ───────────────────────────────────────────────────────
  {
    id: 'p-home',
    kind: 'page',
    title: 'Home',
    description: 'Landing page · hero, stack, story',
    href: '/',
    iconName: 'home',
  },
  {
    id: 'p-about',
    kind: 'page',
    title: 'About',
    description: 'Coming soon · who I am, the long form',
    href: '/about',
    iconName: 'user',
  },
  {
    id: 'p-projects',
    kind: 'page',
    title: 'Projects',
    description: 'Selected work index',
    href: '/projects',
    iconName: 'folder-open',
  },
  {
    id: 'p-blog',
    kind: 'page',
    title: 'Blog',
    description: 'Coming soon · notes and essays',
    href: '/blog',
    iconName: 'briefcase',
  },
  {
    id: 'p-uses',
    kind: 'page',
    title: 'Uses',
    description: 'Hardware, editor, services',
    href: '/uses',
    iconName: 'briefcase',
  },
  {
    id: 'p-colophon',
    kind: 'page',
    title: 'Colophon',
    description: 'Stack and tooling behind this site',
    href: '/colophon',
    iconName: 'code',
  },
  { id: 'p-ddl', kind: 'page', title: 'DDL', description: 'Design sandbox', href: '/ddl', iconName: 'layout-grid' },

  // ─── Page sections ───────────────────────────────────────────────
  {
    id: 's-hero',
    kind: 'section',
    title: 'Hero',
    description: 'Home › Hero',
    href: '/#hero',
    iconName: 'chevron-right',
  },
  {
    id: 's-who',
    kind: 'section',
    title: 'Who I Am',
    description: 'Home › §02',
    href: '/#who',
    iconName: 'chevron-right',
  },
  {
    id: 's-work',
    kind: 'section',
    title: 'Selected Work',
    description: 'Home › §03',
    href: '/#work',
    iconName: 'chevron-right',
  },
  {
    id: 's-stack',
    kind: 'section',
    title: 'The Stack',
    description: 'Home › §04',
    href: '/#stack',
    iconName: 'chevron-right',
  },
  {
    id: 's-story',
    kind: 'section',
    title: 'The Story',
    description: 'Home › §05',
    href: '/#story',
    iconName: 'chevron-right',
  },
  {
    id: 's-contact',
    kind: 'section',
    title: 'Get in Touch',
    description: 'Home › §07',
    href: '/#get-in-touch',
    iconName: 'mail',
  },

  // ─── Actions ─────────────────────────────────────────────────────
  {
    id: 'a-theme',
    kind: 'action',
    title: 'Toggle theme',
    description: 'Switch between light and dark',
    hint: '⌘⇧L',
    iconName: 'sun',
  },
  {
    id: 'a-lang',
    kind: 'action',
    title: 'Switch language',
    description: 'EN ↔ Tiếng Việt',
    iconName: 'globe',
  },
  {
    id: 'a-copy-email',
    kind: 'action',
    title: 'Copy email to clipboard',
    description: 'hello@thunderphong.com',
    iconName: 'mail',
  },
  {
    id: 'a-resume',
    kind: 'action',
    title: 'Download CV (PDF)',
    description: '~120kb · current resume',
    iconName: 'download',
  },
  {
    id: 'a-github',
    kind: 'action',
    title: 'View source on GitHub',
    description: 'Repo for this portfolio',
    iconName: 'github',
  },
  {
    id: 'a-back-top',
    kind: 'action',
    title: 'Scroll to top',
    description: 'Return to the page hero',
    hint: 'home',
    iconName: 'arrow-up',
  },

  // ─── Mock projects ──────────────────────────────────────────────
  {
    id: 'pr-1',
    kind: 'project',
    title: 'Selena · CRDT collab editor',
    description: 'Yjs · React · realtime cursors',
    href: '/projects/selena',
    iconName: 'folder-open',
  },
  {
    id: 'pr-2',
    kind: 'project',
    title: 'Volta · scheduling engine',
    description: 'NestJS · Postgres · cron',
    href: '/projects/volta',
    iconName: 'folder-open',
  },
];

export const KIND_LABEL: Record<SearchKind, string> = {
  page: 'Pages',
  section: 'Sections',
  action: 'Actions',
  project: 'Projects',
  blog: 'Blog',
};

export const KIND_ORDER: readonly SearchKind[] = ['page', 'section', 'project', 'blog', 'action'];

export function filterResults(query: string, all: readonly SearchResult[]): readonly SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((r) => {
    if (r.title.toLowerCase().includes(q)) return true;
    if (r.description && r.description.toLowerCase().includes(q)) return true;
    if (r.kind.toLowerCase().includes(q)) return true;
    return false;
  });
}

export function groupByKind(
  results: readonly SearchResult[]
): ReadonlyArray<{ kind: SearchKind; items: readonly SearchResult[] }> {
  const buckets = new Map<SearchKind, SearchResult[]>();
  for (const r of results) {
    const arr = buckets.get(r.kind) ?? [];
    arr.push(r);
    buckets.set(r.kind, arr);
  }
  return KIND_ORDER.filter((k) => buckets.has(k)).map((k) => ({ kind: k, items: buckets.get(k) ?? [] }));
}
