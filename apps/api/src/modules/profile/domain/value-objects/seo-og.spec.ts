import { SeoOg } from './seo-og';

describe('SeoOg VO', () => {
  const validProps = {
    metaTitle: 'John Doe Portfolio',
    metaDescription: 'Full-stack engineer',
    ogImageId: null,
    canonicalUrl: null,
  };

  describe('immutability', () => {
    it('should be frozen', () => {
      expect(Object.isFrozen(SeoOg.create(validProps))).toBe(true);
    });
  });

  describe('equals()', () => {
    it('should return false when props differ', () => {
      const a = SeoOg.create(validProps);
      const b = SeoOg.create({ ...validProps, metaTitle: 'Different' });

      expect(a.equals(b)).toBe(false);
    });
  });
});
