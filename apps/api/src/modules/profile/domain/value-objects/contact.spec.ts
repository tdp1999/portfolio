import { Contact } from './contact';

describe('Contact VO', () => {
  const validProps = {
    email: 'john@example.com',
    phone: null,
    phoneZalo: null,
    preferredContactPlatform: 'LINKEDIN' as const,
    preferredContactValue: 'https://linkedin.com/in/john',
  };

  describe('create() — validation guards', () => {
    it('should reject empty email', () => {
      expect(() => Contact.create({ ...validProps, email: '' })).toThrow('email is required');
    });

    it('should reject whitespace-only email', () => {
      expect(() => Contact.create({ ...validProps, email: '   ' })).toThrow('email is required');
    });

    it('should reject empty preferredContactValue', () => {
      expect(() => Contact.create({ ...validProps, preferredContactValue: '' })).toThrow(
        'preferredContactValue is required'
      );
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      expect(Object.isFrozen(Contact.create(validProps))).toBe(true);
    });
  });

  describe('equals()', () => {
    it('should return false when props differ', () => {
      const a = Contact.create(validProps);
      const b = Contact.create({ ...validProps, email: 'other@example.com' });

      expect(a.equals(b)).toBe(false);
    });

    it('should return false when phoneZalo differs (and remain reflexive)', () => {
      const a = Contact.create(validProps);
      const b = Contact.create({ ...validProps, phoneZalo: '+84901234567' });

      expect(a.equals(b)).toBe(false);
      expect(b.equals(b)).toBe(true);
    });
  });
});
