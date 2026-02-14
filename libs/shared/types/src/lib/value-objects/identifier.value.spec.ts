import { validate, version } from 'uuid';
import { IdentifierValue } from './identifier.value';

describe('IdentifierValue', () => {
  describe('v7', () => {
    it('should generate a valid UUID', () => {
      const id = IdentifierValue.v7();
      expect(validate(id)).toBe(true);
    });

    it('should generate a v7 UUID', () => {
      const id = IdentifierValue.v7();
      expect(version(id)).toBe(7);
    });

    it('should generate unique IDs', () => {
      const id1 = IdentifierValue.v7();
      const id2 = IdentifierValue.v7();
      expect(id1).not.toBe(id2);
    });
  });

  describe('from', () => {
    it('should accept a valid UUID', () => {
      const id = IdentifierValue.v7();
      expect(IdentifierValue.from(id)).toBe(id);
    });

    it('should throw on invalid UUID', () => {
      expect(() => IdentifierValue.from('not-a-uuid')).toThrow('Invalid UUID');
    });
  });
});
