import { FailureNarrative } from './failure-narrative.value';
import { LIMITS } from '@portfolio/shared/validation';

describe('FailureNarrative', () => {
  describe('create()', () => {
    it('accepts EN-only payload', () => {
      const n = FailureNarrative.create({ en: 'A short beat.', vi: '' }, 'decision');
      expect(n.en).toBe('A short beat.');
      expect(n.vi).toBe('');
      expect(n.fieldName).toBe('decision');
    });

    it('rejects empty EN with field name in the error', () => {
      expect(() => FailureNarrative.create({ en: '', vi: '' }, 'consequence')).toThrow('consequence.en is required');
    });

    it('rejects EN longer than NARRATIVE_MAX', () => {
      const longText = 'a'.repeat(LIMITS.FAILURE_NARRATIVE_MAX + 1);
      expect(() => FailureNarrative.create({ en: longText, vi: '' }, 'lesson')).toThrow(
        `lesson.en must be ≤ ${LIMITS.FAILURE_NARRATIVE_MAX} chars`
      );
    });

    it('rejects VI longer than NARRATIVE_MAX', () => {
      const longText = 'a'.repeat(LIMITS.FAILURE_NARRATIVE_MAX + 1);
      expect(() => FailureNarrative.create({ en: 'ok', vi: longText }, 'lesson')).toThrow(
        `lesson.vi must be ≤ ${LIMITS.FAILURE_NARRATIVE_MAX} chars`
      );
    });

    it('accepts exactly NARRATIVE_MAX chars', () => {
      const maxText = 'a'.repeat(LIMITS.FAILURE_NARRATIVE_MAX);
      const n = FailureNarrative.create({ en: maxText, vi: maxText }, 'decision');
      expect(n.en).toBe(maxText);
      expect(n.vi).toBe(maxText);
    });
  });
});
