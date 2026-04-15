import { Identity } from './identity';

describe('Identity VO', () => {
  const validProps = {
    fullName: { en: 'John Doe', vi: 'Nguyen Van A' },
    title: { en: 'Developer', vi: 'Lap trinh vien' },
    bioShort: { en: 'A dev', vi: 'Mot dev' },
    bioLong: null,
    avatarId: null,
  };

  describe('create() — validation guards', () => {
    it('should reject empty fullName.en', () => {
      expect(() => Identity.create({ ...validProps, fullName: { en: '', vi: 'x' } })).toThrow(
        'fullName.en is required'
      );
    });

    it('should reject whitespace-only fullName.en', () => {
      expect(() => Identity.create({ ...validProps, fullName: { en: '   ', vi: 'x' } })).toThrow(
        'fullName.en is required'
      );
    });

    it('should reject empty title.en', () => {
      expect(() => Identity.create({ ...validProps, title: { en: '', vi: 'x' } })).toThrow('title.en is required');
    });

    it('should reject empty bioShort.en', () => {
      expect(() => Identity.create({ ...validProps, bioShort: { en: '', vi: 'x' } })).toThrow(
        'bioShort.en is required'
      );
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      expect(Object.isFrozen(Identity.create(validProps))).toBe(true);
    });
  });

  describe('equals()', () => {
    it('should return false when props differ', () => {
      const a = Identity.create(validProps);
      const b = Identity.create({ ...validProps, avatarId: 'other' });

      expect(a.equals(b)).toBe(false);
    });
  });
});
