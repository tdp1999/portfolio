import { AboutPrinciple } from './about-principle.entity';
import { IAboutPrincipleProps } from '../about-principle.types';

const validProps = (overrides: Partial<IAboutPrincipleProps> = {}): IAboutPrincipleProps => ({
  id: '0192f000-0000-7000-8000-000000000001',
  order: 0,
  claim: { en: 'Complexity is a constraint, not a flex.', vi: '' },
  expansion: { en: 'Some longer prose.', vi: '' },
  isPublished: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
});

describe('AboutPrinciple', () => {
  describe('create()', () => {
    it('builds an entity with defaults', () => {
      const p = AboutPrinciple.create({
        claim: { en: 'Test claim', vi: '' },
        expansion: { en: 'Test expansion', vi: '' },
      });
      expect(p.id).toBeDefined();
      expect(p.order).toBe(0);
      expect(p.isPublished).toBe(true);
      expect(p.claim.en).toBe('Test claim');
    });

    it('rejects negative order', () => {
      expect(() =>
        AboutPrinciple.create({
          order: -1,
          claim: { en: 'x', vi: '' },
          expansion: { en: 'y', vi: '' },
        })
      ).toThrow('order must be a non-negative integer');
    });

    it('rejects non-integer order', () => {
      expect(() =>
        AboutPrinciple.create({
          order: 1.5,
          claim: { en: 'x', vi: '' },
          expansion: { en: 'y', vi: '' },
        })
      ).toThrow('order must be a non-negative integer');
    });

    it('propagates claim/expansion invariants', () => {
      expect(() =>
        AboutPrinciple.create({
          claim: { en: '', vi: '' },
          expansion: { en: 'ok', vi: '' },
        })
      ).toThrow('claim.en is required');
    });
  });

  describe('update()', () => {
    it('returns a new entity with updated fields and bumped updatedAt', () => {
      const p = AboutPrinciple.load(validProps());
      const updated = p.update({ isPublished: false });
      expect(updated.isPublished).toBe(false);
      expect(updated.updatedAt.getTime()).toBeGreaterThan(p.updatedAt.getTime());
      expect(p.isPublished).toBe(true); // immutable original
    });

    it('re-runs VO invariants on partial update', () => {
      const p = AboutPrinciple.load(validProps());
      expect(() => p.update({ claim: { en: '', vi: '' } })).toThrow('claim.en is required');
    });
  });

  describe('withOrder()', () => {
    it('returns same instance when order unchanged', () => {
      const p = AboutPrinciple.load(validProps({ order: 3 }));
      const same = p.withOrder(3);
      expect(same).toBe(p);
    });

    it('returns new entity with new order and bumped updatedAt', () => {
      const p = AboutPrinciple.load(validProps({ order: 0 }));
      const reordered = p.withOrder(5);
      expect(reordered.order).toBe(5);
      expect(reordered.updatedAt.getTime()).toBeGreaterThan(p.updatedAt.getTime());
    });

    it('rejects negative order', () => {
      const p = AboutPrinciple.load(validProps());
      expect(() => p.withOrder(-1)).toThrow('order must be a non-negative integer');
    });
  });
});
