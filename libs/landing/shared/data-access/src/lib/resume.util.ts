import type { Locale, ResumeUrls } from '@portfolio/shared/types';

/**
 * The resume link to render, plus the language it is actually in when that differs
 * from the reader's.
 *
 * `fallbackLocale` is `null` in the normal case (the file matches the reader) and
 * carries the file's own language otherwise, so the caller can name it on the label.
 */
export interface ResolvedResume {
  readonly url: string;
  readonly fallbackLocale: Locale | null;
}

/**
 * Picks the resume for a reader, preferring their own language and falling back to the
 * other one rather than hiding the link.
 *
 * A locale-matched resume download is a named success action, so an absent `vi` file
 * must not make the CV unreachable for a Vietnamese reader. The trade is that the
 * reader may be handed the other language — which is acceptable only because
 * `fallbackLocale` lets the UI say so on the label instead of downloading it silently.
 * Both directions are handled; an `en`-only profile is the common case today, but a
 * `vi`-only one behaves identically.
 *
 * Shared rather than inlined so the hero and the header cannot drift into resolving
 * the same field differently.
 */
export function resolveResume(urls: ResumeUrls | null | undefined, locale: Locale): ResolvedResume {
  if (!urls) return { url: '', fallbackLocale: null };

  const own = urls[locale]?.url ?? '';
  if (own) return { url: own, fallbackLocale: null };

  const other: Locale = locale === 'en' ? 'vi' : 'en';
  const fallback = urls[other]?.url ?? '';
  return fallback ? { url: fallback, fallbackLocale: other } : { url: '', fallbackLocale: null };
}
