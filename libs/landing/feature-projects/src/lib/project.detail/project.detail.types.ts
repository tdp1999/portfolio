import type { ProjectDetailData, ProjectLinkType } from '@portfolio/landing/shared/data-access';
import type { Locale } from '@portfolio/shared/types';
import { resolveCopy, type InPageSection, type LandingCopyKey } from '@portfolio/landing/shared/ui';

export type ProjectIndexEntry = { readonly slug: string; readonly title: string };

export type DetailState = {
  readonly project: ProjectDetailData | null;
  readonly index: readonly ProjectIndexEntry[];
  /** `false` for the toSignal initial value, `true` for every emission from the fetch
   *  pipeline. Lets `notFound` distinguish "still loading" from "loaded with no match". */
  readonly loaded: boolean;
};

export const LINK_ORDER: readonly ProjectLinkType[] = ['repo', 'demo', 'case-study', 'doc', 'post'];

/**
 * Fallback label per link type when the author left `ProjectLink.label` blank.
 * Same keys the Home selected-work strip reads — this page used to carry its own
 * wording (`Repository` / `Documentation`) for the identical five types.
 */
const LINK_LABEL_KEYS: Record<ProjectLinkType, LandingCopyKey> = {
  repo: 'project.link.repo',
  demo: 'project.link.demo',
  'case-study': 'project.link.caseStudy',
  doc: 'project.link.doc',
  post: 'project.link.post',
};

export function projectLinkLabel(type: ProjectLinkType, locale: Locale): string {
  return resolveCopy(LINK_LABEL_KEYS[type], locale);
}

/** Anchors for the synthesized sections, sharing their titles with the headings. */
export function fallbackToc(locale: Locale): readonly InPageSection[] {
  return [
    { id: 'overview', title: resolveCopy('project.detail.section.overview', locale) },
    { id: 'motivation', title: resolveCopy('project.detail.section.motivation', locale) },
    { id: 'role', title: resolveCopy('project.detail.section.role', locale) },
    { id: 'highlights', title: resolveCopy('project.detail.section.highlights', locale) },
  ];
}

export const HERO_WIDTH = 960;
