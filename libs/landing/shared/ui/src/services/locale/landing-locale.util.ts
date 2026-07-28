import type { Locale } from '@portfolio/shared/types';
import { COOKIE_KEY } from './landing-locale.constants';

/** Narrow an arbitrary string to a `Locale`, or `null` when it is neither. */
export function asLocale(value: string | null | undefined): Locale | null {
  return value === 'en' || value === 'vi' ? value : null;
}

/**
 * Read the locale cookie out of a raw `Cookie` header.
 *
 * The browser side reads the same value through `document.cookie`; this exists
 * for the server, which only ever sees the header. Written as a header parser
 * rather than a `document.cookie` parser so it stays testable without a DOM.
 *
 * **No percent-decoding, deliberately.** The only values ever written are `en`
 * and `vi`, so there is nothing to decode — and `decodeURIComponent` throws
 * `URIError` on a malformed sequence like `%` or `%E4`. This runs inside a field
 * initializer during SSR, on a header any client can set to anything, so a throw
 * here would reject the render and 500 every page for that visitor until they
 * cleared the cookie. An unrecognized value has exactly one correct answer, and
 * it is `null`.
 */
export function localeFromCookieHeader(header: string | null | undefined): Locale | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() !== COOKIE_KEY) continue;
    return asLocale(part.slice(eq + 1).trim());
  }
  return null;
}

/**
 * Best locale from an `Accept-Language` header, honouring q-weights.
 *
 * The server equivalent of `navigator.languages` on the client, so a first-time
 * Vietnamese visitor gets Vietnamese HTML rather than an English first paint
 * that flips after hydration. Only `en` and `vi` are candidates; anything else
 * is ignored rather than treated as a match.
 */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(',')
    .map((entry, index) => {
      const [tag, ...params] = entry.split(';');
      const q = params.map((p) => /^\s*q=([\d.]+)\s*$/.exec(p)).find(Boolean);
      return {
        tag: tag.trim().toLowerCase(),
        // Ties keep header order, which is the order the client meant.
        q: q ? Number(q[1]) : 1,
        index,
      };
    })
    .filter((entry) => entry.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const { tag } of ranked) {
    // Prefix match, so `vi-VN` and `en-GB` both count.
    if (tag.startsWith('vi')) return 'vi';
    if (tag.startsWith('en')) return 'en';
  }
  return null;
}
