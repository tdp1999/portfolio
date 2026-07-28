import type { InPageSection, LandingCopyKey } from '@portfolio/landing/shared/ui';
import type { Locale } from '@portfolio/shared/types';
import { resolveCopy } from '@portfolio/landing/shared/ui';

// In-page-nav sections. Anchor ids match the <h2>s; titles live in LANDING_COPY
// so the TOC and the rest of the site read from one dictionary.
const SECTION_KEYS: ReadonlyArray<readonly [string, LandingCopyKey]> = [
  ['who-i-am', 'legal.privacy.section.whoIAm'],
  ['scope', 'legal.privacy.section.scope'],
  ['data-collected', 'legal.privacy.section.dataCollected'],
  ['processors', 'legal.privacy.section.processors'],
  ['transfers', 'legal.privacy.section.transfers'],
  ['rights', 'legal.privacy.section.rights'],
  ['security', 'legal.privacy.section.security'],
  ['children', 'legal.privacy.section.children'],
  ['external-links', 'legal.privacy.section.externalLinks'],
  ['changes', 'legal.privacy.section.changes'],
  ['contact', 'legal.privacy.section.contact'],
];

export function privacySections(locale: Locale): readonly InPageSection[] {
  return SECTION_KEYS.map(([id, key]) => ({ id, title: resolveCopy(key, locale) }));
}
