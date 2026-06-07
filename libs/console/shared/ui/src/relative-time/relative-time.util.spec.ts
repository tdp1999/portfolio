import { formatAbsolute, formatRelative, formatRelativeFull, isFresh } from './relative-time.util';

describe('relative-time util', () => {
  const now = new Date('2026-04-27T12:00:00Z');

  describe('formatRelative', () => {
    it('returns "just now" within 45 seconds', () => {
      expect(formatRelative(new Date(now.getTime() - 10_000), now)).toBe('just now');
      expect(formatRelative(new Date(now.getTime() - 44_000), now)).toBe('just now');
    });

    it('formats minutes', () => {
      expect(formatRelative(new Date(now.getTime() - 60_000), now)).toBe('1 minute ago');
      expect(formatRelative(new Date(now.getTime() - 5 * 60_000), now)).toBe('5 minutes ago');
    });

    it('formats hours', () => {
      expect(formatRelative(new Date(now.getTime() - 3 * 60 * 60_000), now)).toBe('3 hours ago');
    });

    it('formats days', () => {
      expect(formatRelative(new Date(now.getTime() - 2 * 24 * 60 * 60_000), now)).toBe('2 days ago');
    });

    it('formats future times', () => {
      expect(formatRelative(new Date(now.getTime() + 3 * 60 * 60_000), now)).toBe('in 3 hours');
    });

    it('handles invalid input', () => {
      expect(formatRelative('not-a-date', now)).toBe('');
    });
  });

  describe('formatRelativeFull', () => {
    it('shows two largest units', () => {
      const past = new Date(now.getTime() - (3 * 60 * 60_000 + 14 * 60_000));
      expect(formatRelativeFull(past, now)).toBe('3 hours 14 minutes ago');
    });

    it('drops zero parts', () => {
      const past = new Date(now.getTime() - 5 * 24 * 60 * 60_000);
      expect(formatRelativeFull(past, now)).toBe('5 days ago');
    });
  });

  describe('formatAbsolute', () => {
    it('produces a non-empty locale string', () => {
      expect(formatAbsolute(now)).toMatch(/2026/);
    });
  });

  describe('isFresh', () => {
    it('true within an hour', () => {
      expect(isFresh(new Date(now.getTime() - 30 * 60_000), now)).toBe(true);
    });
    it('false beyond an hour', () => {
      expect(isFresh(new Date(now.getTime() - 2 * 60 * 60_000), now)).toBe(false);
    });
  });
});
