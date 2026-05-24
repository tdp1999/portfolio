import { PrincipleClaim } from './principle-claim.value';
import { ABOUT_PRINCIPLE_LIMITS } from '../about-principle.types';

describe('PrincipleClaim', () => {
  describe('create()', () => {
    it('accepts EN-only payload (VI empty string is OK)', () => {
      const claim = PrincipleClaim.create({ en: 'Boundaries before abstractions.', vi: '' });
      expect(claim.en).toBe('Boundaries before abstractions.');
      expect(claim.vi).toBe('');
    });

    it('accepts bilingual payload and trims', () => {
      const claim = PrincipleClaim.create({ en: '  Test EN  ', vi: '  Test VI  ' });
      expect(claim.en).toBe('Test EN');
      expect(claim.vi).toBe('Test VI');
    });

    it('rejects empty EN', () => {
      expect(() => PrincipleClaim.create({ en: '', vi: 'Test' })).toThrow('claim.en is required');
    });

    it('rejects whitespace-only EN', () => {
      expect(() => PrincipleClaim.create({ en: '   ', vi: 'Test' })).toThrow('claim.en is required');
    });

    it('rejects EN longer than CLAIM_MAX', () => {
      const longText = 'a'.repeat(ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX + 1);
      expect(() => PrincipleClaim.create({ en: longText, vi: '' })).toThrow(
        `claim.en must be ≤ ${ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX} chars`
      );
    });

    it('rejects VI longer than CLAIM_MAX', () => {
      const longText = 'a'.repeat(ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX + 1);
      expect(() => PrincipleClaim.create({ en: 'short', vi: longText })).toThrow(
        `claim.vi must be ≤ ${ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX} chars`
      );
    });

    it('accepts exactly CLAIM_MAX chars', () => {
      const maxText = 'a'.repeat(ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX);
      const claim = PrincipleClaim.create({ en: maxText, vi: maxText });
      expect(claim.en).toBe(maxText);
      expect(claim.vi).toBe(maxText);
    });
  });

  describe('fromPersistence()', () => {
    it('skips invariant checks and accepts any value', () => {
      const claim = PrincipleClaim.fromPersistence({ en: '', vi: '' });
      expect(claim.en).toBe('');
      expect(claim.vi).toBe('');
    });
  });
});
