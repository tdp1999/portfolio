import type { InPageSection, LandingCopyKey } from '@portfolio/landing/shared/ui';
import type { Locale } from '@portfolio/shared/types';
import { resolveCopy } from '@portfolio/landing/shared/ui';

// In-page-nav sections. Anchor ids match the <h2>s; titles live in LANDING_COPY
// so the TOC and the rest of the site read from one dictionary.
const SECTION_KEYS: ReadonlyArray<readonly [string, LandingCopyKey]> = [
  ['the-site', 'legal.terms.section.theSite'],
  ['ip', 'legal.terms.section.ip'],
  ['acceptable-use', 'legal.terms.section.acceptableUse'],
  ['contact-form', 'legal.terms.section.contactForm'],
  ['links', 'legal.terms.section.links'],
  ['no-warranty', 'legal.terms.section.noWarranty'],
  ['liability', 'legal.terms.section.liability'],
  ['privacy', 'legal.terms.section.privacy'],
  ['changes', 'legal.terms.section.changes'],
  ['governing-law', 'legal.terms.section.governingLaw'],
  ['indemnification', 'legal.terms.section.indemnification'],
  ['severability', 'legal.terms.section.severability'],
  ['contact', 'legal.terms.section.contact'],
];

export function termsSections(locale: Locale): readonly InPageSection[] {
  return SECTION_KEYS.map(([id, key]) => ({ id, title: resolveCopy(key, locale) }));
}
