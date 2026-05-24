import { AboutFailure } from './about-failure.entity';
import { IAboutFailureProps } from '../about-failure.types';

const validProps = (overrides: Partial<IAboutFailureProps> = {}): IAboutFailureProps => ({
  id: '0192f000-0000-7000-8000-000000000001',
  order: 0,
  year: 2021,
  context: { en: 'At a B2B SaaS', vi: '' },
  decision: { en: 'Decision EN', vi: '' },
  consequence: { en: 'Consequence EN', vi: '' },
  lesson: { en: 'Lesson EN', vi: '' },
  isPublished: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

const basePayload = () => ({
  year: 2021,
  context: { en: 'At a B2B SaaS', vi: '' },
  decision: { en: 'Decision EN', vi: '' },
  consequence: { en: 'Consequence EN', vi: '' },
  lesson: { en: 'Lesson EN', vi: '' },
});

describe('AboutFailure', () => {
  describe('create()', () => {
    it('builds an entity with defaults', () => {
      const f = AboutFailure.create(basePayload());
      expect(f.id).toBeDefined();
      expect(f.order).toBe(0);
      expect(f.year).toBe(2021);
      expect(f.isPublished).toBe(true);
      expect(f.decision.en).toBe('Decision EN');
    });

    it('rejects negative order', () => {
      expect(() => AboutFailure.create({ ...basePayload(), order: -1 })).toThrow(
        'order must be a non-negative integer'
      );
    });

    it('rejects non-integer order', () => {
      expect(() => AboutFailure.create({ ...basePayload(), order: 1.5 })).toThrow(
        'order must be a non-negative integer'
      );
    });

    it('propagates context invariants', () => {
      expect(() => AboutFailure.create({ ...basePayload(), context: { en: '', vi: '' } })).toThrow(
        'context.en is required'
      );
    });

    it('propagates lesson invariants', () => {
      expect(() => AboutFailure.create({ ...basePayload(), lesson: { en: '', vi: '' } })).toThrow(
        'lesson.en is required'
      );
    });

    it('propagates year invariants (future year)', () => {
      const futureYear = new Date().getFullYear() + 1;
      expect(() => AboutFailure.create({ ...basePayload(), year: futureYear })).toThrow(/year must be between/);
    });
  });

  describe('update()', () => {
    it('returns a new entity with updated fields and bumped updatedAt', () => {
      const f = AboutFailure.load(validProps());
      const updated = f.update({ isPublished: false });
      expect(updated.isPublished).toBe(false);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(f.updatedAt.getTime());
      expect(f.isPublished).toBe(true); // immutable original
    });

    it('re-runs VO invariants on partial update', () => {
      const f = AboutFailure.load(validProps());
      expect(() => f.update({ decision: { en: '', vi: '' } })).toThrow('decision.en is required');
    });

    it('updates year via the year VO', () => {
      const f = AboutFailure.load(validProps());
      const updated = f.update({ year: 2022 });
      expect(updated.year).toBe(2022);
    });
  });

  describe('withOrder()', () => {
    it('returns same instance when order unchanged', () => {
      const f = AboutFailure.load(validProps({ order: 3 }));
      expect(f.withOrder(3)).toBe(f);
    });

    it('returns new entity with new order and bumped updatedAt', () => {
      const f = AboutFailure.load(validProps({ order: 0 }));
      const reordered = f.withOrder(5);
      expect(reordered.order).toBe(5);
      expect(reordered.updatedAt.getTime()).toBeGreaterThan(f.updatedAt.getTime());
    });

    it('rejects negative order', () => {
      const f = AboutFailure.load(validProps());
      expect(() => f.withOrder(-1)).toThrow('order must be a non-negative integer');
    });
  });
});
