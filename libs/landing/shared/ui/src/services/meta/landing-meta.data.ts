import { resolveCopy } from '../copy';
import type { Locale } from '@portfolio/shared/types';

/** Marks the canonical link this service owns, so it can replace its own and nobody else's. */
export const CANONICAL_TAG = 'data-landing-canonical';

/** Absolute origin. Open Graph requires absolute URLs, so every og:* value is built from this. */
export const SITE_URL = 'https://thunderphong.com';

/** Site-wide share image, used whenever a page has nothing more specific. */
export const OG_IMAGE = `${SITE_URL}/brand/og.png`;

/** Open Graph wants a full locale code, not the two-letter tag the app uses. */
export const OG_LOCALE: Readonly<Record<Locale, string>> = { en: 'en_US', vi: 'vi_VN' };

/**
 * Site-wide `<title>` / description fallback: used by pages that set none of
 * their own, and by the home page when the profile carries no SEO fields.
 *
 * Both take a locale and there is deliberately no locale-free shortcut. There
 * used to be a `DEFAULT_TITLE` pair resolved at module load, justified by "the
 * English half is what SSR renders anyway" — no longer true now that the server
 * reads the visitor's locale off the request, and the home page was quietly
 * serving English metadata to Vietnamese visitors because of it.
 */
export function defaultTitle(locale: Locale): string {
  return resolveCopy('site.meta.title', locale);
}

export function defaultDescription(locale: Locale): string {
  return resolveCopy('site.meta.description', locale);
}
