import type { ProjectLink, ProjectLinkType } from '@portfolio/landing/shared/data-access';
import type { Locale } from '@portfolio/shared/types';
import { resolveCopy, type LandingCopyKey } from '@portfolio/landing/shared/ui';

export type GroupedLink = { readonly label: string; readonly href: string; readonly external: boolean };
export type LinkGroupKey = 'visit' | 'source' | 'read';
export type LinkGroup = { readonly key: LinkGroupKey; readonly links: readonly GroupedLink[] };

/** Fallback label per link type when the author left `ProjectLink.label` blank. */
const LINK_LABEL_KEYS: Record<ProjectLinkType, LandingCopyKey> = {
  repo: 'project.link.repo',
  demo: 'project.link.demo',
  'case-study': 'project.link.caseStudy',
  doc: 'project.link.doc',
  post: 'project.link.post',
};

/** Maps each link type to its semantic group. `case-study` is rendered inline as a "read more" link inside the description, not in the grouped list. */
const LINK_GROUP: Record<Exclude<ProjectLinkType, 'case-study'>, LinkGroupKey> = {
  demo: 'visit',
  repo: 'source',
  doc: 'read',
  post: 'read',
};

const GROUP_ORDER: readonly LinkGroupKey[] = ['visit', 'source', 'read'];

function toGroupedLink(link: ProjectLink, locale: Locale): GroupedLink {
  return {
    label: link.label || resolveCopy(LINK_LABEL_KEYS[link.type], locale),
    href: link.url,
    external: /^https?:\/\//i.test(link.url),
  };
}

/** Buckets project links by purpose (visit/source/read), skipping `case-study` which renders inline. */
export function buildLinkGroups(
  links: readonly ProjectLink[] | null | undefined,
  locale: Locale
): readonly LinkGroup[] {
  const buckets: Record<LinkGroupKey, GroupedLink[]> = { visit: [], source: [], read: [] };
  for (const l of links ?? []) {
    if (l.type === 'case-study') continue;
    const key = LINK_GROUP[l.type];
    buckets[key].push(toGroupedLink(l, locale));
  }
  return GROUP_ORDER.map((key) => ({ key, links: buckets[key] })).filter((g) => g.links.length > 0);
}

/** Returns the 4-digit start-year of a project, or '' when missing. */
export function projectYear(startDate: string | null | undefined): string {
  return startDate ? new Date(startDate).getFullYear().toString() : '';
}
