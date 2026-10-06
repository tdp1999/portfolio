import type { GuideRef } from './help.types';

const SLUG = /^[a-z0-9-]+$/;

/**
 * Path of a guide served from the console's build assets: each guide is listed by name in
 * `apps/console/project.json` and copied from `.context/guides/` to `/guides/`. Build assets
 * are public, so only list a guide that is fine to read without logging in. Null for a
 * malformed slug or section, so a typo can never turn into a URL outside that folder.
 */
export function guidePath({ guide, section }: GuideRef): string | null {
  if (!SLUG.test(guide) || (section !== undefined && !SLUG.test(section))) return null;
  return `/guides/${guide}.html${section ? `#${section}` : ''}`;
}
