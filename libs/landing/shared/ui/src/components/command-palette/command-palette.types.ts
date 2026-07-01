import { InjectionToken } from '@angular/core';

export interface FlatRow {
  readonly result: CommandResult;
  readonly groupHeader?: string;
}

export type CommandKind = 'page' | 'section' | 'action' | 'project' | 'blog' | 'doc';

export interface CommandResult {
  readonly id: string;
  readonly kind: CommandKind;
  readonly title: string;
  readonly description?: string;
  /** Right-side hint (e.g., shortcut combo, route hint). */
  readonly hint?: string;
  /** Lucide icon name. */
  readonly iconName: string;
  /** Internal route or external href. */
  readonly href?: string;
  /** Optional anchor fragment for internal routes. */
  readonly fragment?: string;
  /** Callback to run on activation (for actions). Mutually exclusive with `href` semantically. */
  readonly handler?: () => void;
}

export const KIND_LABEL: Record<CommandKind, string> = {
  page: 'Pages',
  section: 'Sections',
  doc: 'DDL',
  action: 'Actions',
  project: 'Projects',
  blog: 'Blog',
};

export const KIND_ORDER: readonly CommandKind[] = ['page', 'section', 'doc', 'project', 'blog', 'action'];

/**
 * Extra command results contributed by the app (e.g. the DDL design-system
 * registry). These surface ONLY while the user is searching — they don't pad the
 * default (empty-query) list. Provide at the app root with `useValue`.
 */
export const COMMAND_PALETTE_SEARCH_SOURCES = new InjectionToken<readonly CommandResult[]>(
  'landing.command-palette.search-sources',
  { factory: () => [] }
);

/** Static manifest of top-level pages — ships with the bundle. */
export const PAGE_MANIFEST: readonly CommandResult[] = [
  {
    id: 'p-home',
    kind: 'page',
    title: 'Home',
    description: 'Landing — hero, stack, story',
    href: '/',
    iconName: 'home',
  },
  { id: 'p-about', kind: 'page', title: 'About', description: 'Coming soon', href: '/about', iconName: 'user' },
  {
    id: 'p-projects',
    kind: 'page',
    title: 'Projects',
    description: 'Selected work index',
    href: '/projects',
    iconName: 'folder-open',
  },
  { id: 'p-blog', kind: 'page', title: 'Blog', description: 'Coming soon', href: '/blog', iconName: 'briefcase' },
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
];

/** Static manifest of in-page section anchors. */
export const SECTION_MANIFEST: readonly CommandResult[] = [
  {
    id: 's-hero',
    kind: 'section',
    title: 'Hero',
    description: 'Home › Hero',
    href: '/',
    fragment: 'hero',
    iconName: 'chevron-right',
  },
  {
    id: 's-who',
    kind: 'section',
    title: 'Who I Am',
    description: 'Home › §02',
    href: '/',
    fragment: 'who',
    iconName: 'chevron-right',
  },
  {
    id: 's-work',
    kind: 'section',
    title: 'Selected Work',
    description: 'Home › §03',
    href: '/',
    fragment: 'work',
    iconName: 'chevron-right',
  },
  {
    id: 's-stack',
    kind: 'section',
    title: 'The Stack',
    description: 'Home › §04',
    href: '/',
    fragment: 'stack',
    iconName: 'chevron-right',
  },
  {
    id: 's-story',
    kind: 'section',
    title: 'The Story',
    description: 'Home › §05',
    href: '/',
    fragment: 'story',
    iconName: 'chevron-right',
  },
  {
    id: 's-contact',
    kind: 'section',
    title: 'Get in Touch',
    description: 'Home › §07',
    href: '/',
    fragment: 'get-in-touch',
    iconName: 'mail',
  },
];

export function filterCommands(query: string, all: readonly CommandResult[]): readonly CommandResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return all;
  return all.filter((r) => {
    if (r.title.toLowerCase().includes(q)) return true;
    if (r.description && r.description.toLowerCase().includes(q)) return true;
    if (r.kind.toLowerCase().includes(q)) return true;
    if (r.hint && r.hint.toLowerCase().includes(q)) return true;
    return false;
  });
}

export function groupCommandsByKind(
  results: readonly CommandResult[]
): ReadonlyArray<{ kind: CommandKind; items: readonly CommandResult[] }> {
  const buckets = new Map<CommandKind, CommandResult[]>();
  for (const r of results) {
    const arr = buckets.get(r.kind) ?? [];
    arr.push(r);
    buckets.set(r.kind, arr);
  }
  return KIND_ORDER.filter((k) => buckets.has(k)).map((k) => ({ kind: k, items: buckets.get(k) ?? [] }));
}
