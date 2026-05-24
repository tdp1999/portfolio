import { FailureContext } from './failure-context.value';
import { ABOUT_FAILURE_LIMITS } from '../about-failure.types';

describe('FailureContext', () => {
  describe('create()', () => {
    it('accepts EN-only payload (VI empty string is OK)', () => {
      const c = FailureContext.create({ en: 'At a B2B SaaS · team of 8', vi: '' });
      expect(c.en).toBe('At a B2B SaaS · team of 8');
      expect(c.vi).toBe('');
    });

    it('accepts bilingual payload and trims', () => {
      const c = FailureContext.create({ en: '  EN ctx  ', vi: '  VI ctx  ' });
      expect(c.en).toBe('EN ctx');
      expect(c.vi).toBe('VI ctx');
    });

    it('rejects empty EN', () => {
      expect(() => FailureContext.create({ en: '', vi: 'x' })).toThrow('context.en is required');
    });

    it('rejects whitespace-only EN', () => {
      expect(() => FailureContext.create({ en: '   ', vi: 'x' })).toThrow('context.en is required');
    });

    it('rejects EN longer than CONTEXT_MAX', () => {
      const longText = 'a'.repeat(ABOUT_FAILURE_LIMITS.CONTEXT_MAX + 1);
      expect(() => FailureContext.create({ en: longText, vi: '' })).toThrow(
        `context.en must be ≤ ${ABOUT_FAILURE_LIMITS.CONTEXT_MAX} chars`
      );
    });

    it('rejects VI longer than CONTEXT_MAX', () => {
      const longText = 'a'.repeat(ABOUT_FAILURE_LIMITS.CONTEXT_MAX + 1);
      expect(() => FailureContext.create({ en: 'short', vi: longText })).toThrow(
        `context.vi must be ≤ ${ABOUT_FAILURE_LIMITS.CONTEXT_MAX} chars`
      );
    });
  });

  describe('fromPersistence()', () => {
    it('skips invariant checks and accepts any value', () => {
      const c = FailureContext.fromPersistence({ en: '', vi: '' });
      expect(c.en).toBe('');
      expect(c.vi).toBe('');
    });
  });
});
