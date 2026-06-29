import type { ProjectDetailData, ProjectLinkType } from '@portfolio/landing/shared/data-access';
import type { InPageSection } from '@portfolio/landing/shared/ui';

export type ProjectIndexEntry = { readonly slug: string; readonly title: string };

export type DetailState = {
  readonly project: ProjectDetailData | null;
  readonly index: readonly ProjectIndexEntry[];
  /** `false` for the toSignal initial value, `true` for every emission from the fetch
   *  pipeline. Lets `notFound` distinguish "still loading" from "loaded with no match". */
  readonly loaded: boolean;
};

export const LINK_ORDER: readonly ProjectLinkType[] = ['repo', 'demo', 'case-study', 'doc', 'post'];

export const LINK_TYPE_LABEL: Record<ProjectLinkType, string> = {
  repo: 'Repository',
  demo: 'Live demo',
  'case-study': 'Case study',
  doc: 'Documentation',
  post: 'Write-up',
};

export const LIFECYCLE_STATUS_LABEL: Record<'LIVE' | 'SHIPPED' | 'ARCHIVED' | 'BETA' | 'ONGOING', string> = {
  LIVE: 'Live',
  SHIPPED: 'Shipped',
  ARCHIVED: 'Archived',
  BETA: 'Beta',
  ONGOING: 'Ongoing',
};

export const FALLBACK_TOC: readonly InPageSection[] = [
  { id: 'overview', title: 'Overview' },
  { id: 'motivation', title: 'Motivation' },
  { id: 'role', title: 'My role' },
  { id: 'highlights', title: 'Highlights' },
];

export const HERO_WIDTH = 960;
