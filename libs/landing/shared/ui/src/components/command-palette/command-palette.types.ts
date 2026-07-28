import { InjectionToken } from '@angular/core';
import type { Locale } from '@portfolio/shared/types';
import { resolveCopy, type LandingCopyKey } from '../../services/copy';

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

/** Group headers, as copy keys — the palette resolves them per locale. */
export const KIND_LABEL_KEYS: Record<CommandKind, LandingCopyKey> = {
  page: 'palette.group.pages',
  section: 'palette.group.sections',
  doc: 'common.page.ddl',
  action: 'palette.group.actions',
  project: 'common.page.projects',
  blog: 'common.page.blog',
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

/** Top-level pages, resolved per locale. Titles reuse the shared `common.page.*`
 *  entries so a page rename never has to be repeated here. */
export function pageManifest(locale: Locale): readonly CommandResult[] {
  const t = (key: LandingCopyKey) => resolveCopy(key, locale);
  return [
    {
      id: 'p-home',
      kind: 'page',
      title: t('common.page.home'),
      description: t('palette.page.home.desc'),
      href: '/',
      iconName: 'home',
    },
    {
      id: 'p-about',
      kind: 'page',
      title: t('common.page.about'),
      description: t('palette.page.about.desc'),
      href: '/about',
      iconName: 'user',
    },
    {
      id: 'p-projects',
      kind: 'page',
      title: t('common.page.projects'),
      description: t('palette.page.projects.desc'),
      href: '/projects',
      iconName: 'folder-open',
    },
    {
      id: 'p-blog',
      kind: 'page',
      title: t('common.page.blog'),
      description: t('palette.page.blog.desc'),
      href: '/blog',
      iconName: 'briefcase',
    },
    {
      id: 'p-uses',
      kind: 'page',
      title: t('common.page.uses'),
      description: t('palette.page.uses.desc'),
      href: '/uses',
      iconName: 'briefcase',
    },
    {
      id: 'p-colophon',
      kind: 'page',
      title: t('common.page.colophon'),
      description: t('palette.page.colophon.desc'),
      href: '/colophon',
      iconName: 'code',
    },
    {
      id: 'p-ddl',
      kind: 'page',
      title: t('common.page.ddl'),
      description: t('palette.page.ddl.desc'),
      href: '/ddl',
      iconName: 'layout-grid',
    },
  ];
}

/** In-page section anchors, resolved per locale. Titles come from `home.section.*`,
 *  the same entries the Home floating-pill nav reads. */
export function sectionManifest(locale: Locale): readonly CommandResult[] {
  const home = resolveCopy('common.page.home', locale);
  const crumb = (n: string) => `${home} › ${n}`;
  const t = (key: LandingCopyKey) => resolveCopy(key, locale);
  return [
    {
      id: 's-hero',
      kind: 'section',
      title: t('home.section.hero'),
      description: crumb(t('home.section.hero')),
      href: '/',
      fragment: 'hero',
      iconName: 'chevron-right',
    },
    {
      id: 's-who',
      kind: 'section',
      title: t('home.section.who'),
      description: crumb('§02'),
      href: '/',
      fragment: 'who',
      iconName: 'chevron-right',
    },
    {
      id: 's-work',
      kind: 'section',
      title: t('home.section.work'),
      description: crumb('§03'),
      href: '/',
      fragment: 'work',
      iconName: 'chevron-right',
    },
    {
      id: 's-stack',
      kind: 'section',
      title: t('home.section.stack'),
      description: crumb('§04'),
      href: '/',
      fragment: 'stack',
      iconName: 'chevron-right',
    },
    {
      id: 's-story',
      kind: 'section',
      title: t('home.section.story'),
      description: crumb('§05'),
      href: '/',
      fragment: 'story',
      iconName: 'chevron-right',
    },
    {
      id: 's-contact',
      kind: 'section',
      title: t('home.section.getInTouch'),
      // Was §07 — the Home page only goes to §06.
      description: crumb('§06'),
      href: '/',
      fragment: 'get-in-touch',
      iconName: 'mail',
    },
  ];
}

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
