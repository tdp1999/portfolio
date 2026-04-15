import { Location } from './location';

describe('Location VO', () => {
  const validProps = {
    country: 'Vietnam',
    city: 'Ho Chi Minh',
    postalCode: null,
    address1: null,
    address2: null,
  };

  describe('create() — validation guards', () => {
    it('should reject empty country', () => {
      expect(() => Location.create({ ...validProps, country: '' })).toThrow('country is required');
    });

    it('should reject whitespace-only country', () => {
      expect(() => Location.create({ ...validProps, country: '   ' })).toThrow('country is required');
    });

    it('should reject empty city', () => {
      expect(() => Location.create({ ...validProps, city: '' })).toThrow('city is required');
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      expect(Object.isFrozen(Location.create(validProps))).toBe(true);
    });
  });

  describe('equals()', () => {
    it('should return false when props differ', () => {
      const a = Location.create(validProps);
      const b = Location.create({ ...validProps, city: 'Hanoi' });

      expect(a.equals(b)).toBe(false);
    });
  });
});
