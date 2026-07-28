import { asLocale, localeFromAcceptLanguage, localeFromCookieHeader } from './landing-locale.util';

/**
 * These two parsers decide the language of the **first paint** on the server.
 * Getting them wrong is not a crash, it is a Vietnamese visitor reading English
 * for one frame — the exact failure this code was written to remove — so the
 * near-miss cases are pinned here rather than left to a browser check.
 */
describe('landing locale request parsing', () => {
  describe('asLocale', () => {
    it('accepts the two supported locales and rejects everything else', () => {
      expect(asLocale('en')).toBe('en');
      expect(asLocale('vi')).toBe('vi');
      expect(asLocale('EN')).toBeNull();
      expect(asLocale('vi-VN')).toBeNull();
      expect(asLocale('')).toBeNull();
      expect(asLocale(null)).toBeNull();
      expect(asLocale(undefined)).toBeNull();
    });
  });

  describe('localeFromCookieHeader', () => {
    it('reads the locale cookie from anywhere in the header', () => {
      expect(localeFromCookieHeader('landing_locale=vi')).toBe('vi');
      expect(localeFromCookieHeader('landing_theme=dark; landing_locale=vi')).toBe('vi');
      expect(localeFromCookieHeader('landing_locale=en; landing_theme=light')).toBe('en');
    });

    it('tolerates the whitespace real clients send', () => {
      expect(localeFromCookieHeader('a=1;  landing_locale=vi ; b=2')).toBe('vi');
    });

    it('does not match a cookie whose name merely ends with the key', () => {
      // `landing_theme` and `landing_locale` share a prefix, and a substring
      // match would also accept a third-party `x_landing_locale`.
      expect(localeFromCookieHeader('x_landing_locale=vi')).toBeNull();
      expect(localeFromCookieHeader('landing_locale_old=vi')).toBeNull();
    });

    it('survives a malformed percent-encoded value', () => {
      // This parser runs in a field initializer during SSR, on a header the
      // client controls. `decodeURIComponent('%')` throws `URIError`, which
      // would reject the render and 500 every page for that visitor until they
      // cleared the cookie. Nothing here decodes, so nothing here throws.
      expect(localeFromCookieHeader('landing_locale=%')).toBeNull();
      expect(localeFromCookieHeader('landing_locale=%E4%F6')).toBeNull();
      expect(localeFromCookieHeader('landing_locale=100%')).toBeNull();
    });

    it('returns null for a missing, empty, or unsupported value', () => {
      expect(localeFromCookieHeader('landing_theme=dark')).toBeNull();
      expect(localeFromCookieHeader('landing_locale=fr')).toBeNull();
      expect(localeFromCookieHeader('landing_locale=')).toBeNull();
      expect(localeFromCookieHeader('')).toBeNull();
      expect(localeFromCookieHeader(null)).toBeNull();
    });
  });

  describe('localeFromAcceptLanguage', () => {
    it('matches on the language prefix, not the full tag', () => {
      expect(localeFromAcceptLanguage('vi-VN')).toBe('vi');
      expect(localeFromAcceptLanguage('en-GB')).toBe('en');
    });

    it('honours q-weights rather than header order', () => {
      // A Vietnamese speaker with English as fallback: `en` comes first in the
      // string but asks for less weight. Scanning in order would pick English.
      expect(localeFromAcceptLanguage('en;q=0.7,vi;q=0.9')).toBe('vi');
      expect(localeFromAcceptLanguage('fr,vi;q=0.8,en;q=0.5')).toBe('vi');
    });

    it('keeps header order when weights tie', () => {
      expect(localeFromAcceptLanguage('vi,en')).toBe('vi');
      expect(localeFromAcceptLanguage('en,vi')).toBe('en');
      expect(localeFromAcceptLanguage('vi;q=0.8,en;q=0.8')).toBe('vi');
    });

    it('skips languages it does not serve', () => {
      expect(localeFromAcceptLanguage('fr-FR,de;q=0.8,en;q=0.3')).toBe('en');
      expect(localeFromAcceptLanguage('fr-FR,de;q=0.8')).toBeNull();
    });

    it('ignores an explicitly refused language', () => {
      // `q=0` means "do not send me this".
      expect(localeFromAcceptLanguage('vi;q=0,en;q=0.5')).toBe('en');
    });

    it('returns null for a missing header', () => {
      expect(localeFromAcceptLanguage('')).toBeNull();
      expect(localeFromAcceptLanguage(null)).toBeNull();
      expect(localeFromAcceptLanguage(undefined)).toBeNull();
    });
  });
});
