import { PrincipleExpansion } from './principle-expansion.value';
import { ABOUT_PRINCIPLE_LIMITS } from '../about-principle.types';

describe('PrincipleExpansion', () => {
  describe('create()', () => {
    it('accepts EN-only payload (VI empty string is OK)', () => {
      const exp = PrincipleExpansion.create({ en: 'Some expansion text.', vi: '' });
      expect(exp.en).toBe('Some expansion text.');
      expect(exp.vi).toBe('');
    });

    it('rejects empty EN', () => {
      expect(() => PrincipleExpansion.create({ en: '', vi: 'Test' })).toThrow('expansion.en is required');
    });

    it('rejects EN longer than EXPANSION_MAX', () => {
      const longText = 'a'.repeat(ABOUT_PRINCIPLE_LIMITS.EXPANSION_MAX + 1);
      expect(() => PrincipleExpansion.create({ en: longText, vi: '' })).toThrow(
        `expansion.en must be ≤ ${ABOUT_PRINCIPLE_LIMITS.EXPANSION_MAX} chars`
      );
    });

    it('accepts exactly EXPANSION_MAX chars', () => {
      const maxText = 'a'.repeat(ABOUT_PRINCIPLE_LIMITS.EXPANSION_MAX);
      const exp = PrincipleExpansion.create({ en: maxText, vi: maxText });
      expect(exp.en).toBe(maxText);
      expect(exp.vi).toBe(maxText);
    });
  });
});
