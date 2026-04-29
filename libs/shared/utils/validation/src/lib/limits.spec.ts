import { LIMITS } from './limits';
import { PATTERNS } from './patterns';
import { ERROR_KEYS } from './error-keys';

describe('shared-validation constants', () => {
  it('locks in canonical caps from the validation epic ADRs', () => {
    expect(LIMITS.YOE_MAX).toBe(99);
    expect(LIMITS.DISPLAY_ORDER_MIN).toBe(0);
    expect(LIMITS.META_TITLE_MAX).toBe(70);
    expect(LIMITS.META_DESCRIPTION_MAX).toBe(160);
    expect(LIMITS.TAG_NAME_MAX).toBe(50);
    expect(LIMITS.URL_MAX).toBe(500);
    expect(LIMITS.PASSWORD_MIN).toBe(8);
  });

  it('PATTERNS.PASSWORD encodes the LIMITS.PASSWORD_MIN length quantifier', () => {
    // Guards against drift between the regex literal and the canonical constant.
    expect(PATTERNS.PASSWORD.source).toContain(`.{${LIMITS.PASSWORD_MIN},}`);
  });

  describe('PATTERNS.PASSWORD', () => {
    it('rejects weak passwords missing required character classes', () => {
      expect(PATTERNS.PASSWORD.test('password')).toBe(false);
      expect(PATTERNS.PASSWORD.test('Password1')).toBe(false);
      expect(PATTERNS.PASSWORD.test('password1!')).toBe(false);
      expect(PATTERNS.PASSWORD.test('PASSWORD1!')).toBe(false);
      expect(PATTERNS.PASSWORD.test('Pass1!')).toBe(false);
    });

    it('accepts strong passwords with all required classes', () => {
      expect(PATTERNS.PASSWORD.test('Password1!')).toBe(true);
      expect(PATTERNS.PASSWORD.test('Aa1#aaaa')).toBe(true);
    });
  });

  describe('PATTERNS.URL', () => {
    it('accepts http/https URLs', () => {
      expect(PATTERNS.URL.test('https://example.com')).toBe(true);
      expect(PATTERNS.URL.test('http://localhost:3000/path?q=1')).toBe(true);
    });

    it('rejects non-URLs', () => {
      expect(PATTERNS.URL.test('example.com')).toBe(false);
      expect(PATTERNS.URL.test('ftp://example.com')).toBe(false);
      expect(PATTERNS.URL.test('not a url')).toBe(false);
      expect(PATTERNS.URL.test('https://')).toBe(false);
    });
  });

  describe('PATTERNS.SLUG', () => {
    it('accepts lowercase hyphenated slugs', () => {
      expect(PATTERNS.SLUG.test('my-post')).toBe(true);
      expect(PATTERNS.SLUG.test('post123')).toBe(true);
      expect(PATTERNS.SLUG.test('a-b-c')).toBe(true);
    });

    it('rejects malformed slugs', () => {
      expect(PATTERNS.SLUG.test('My-Post')).toBe(false);
      expect(PATTERNS.SLUG.test('-leading')).toBe(false);
      expect(PATTERNS.SLUG.test('trailing-')).toBe(false);
      expect(PATTERNS.SLUG.test('double--dash')).toBe(false);
    });
  });

  it('exposes the error keys consumed by FormErrorPipe', () => {
    expect(ERROR_KEYS.passwordWeak).toBe('passwordWeak');
    expect(ERROR_KEYS.urlInvalid).toBe('urlInvalid');
    expect(ERROR_KEYS.integerOnly).toBe('integerOnly');
    expect(ERROR_KEYS.translatableEnViRequired).toBe('translatableEnViRequired');
  });
});
