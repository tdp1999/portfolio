import { TemporalValue } from './temporal.value';

describe('TemporalValue', () => {
  describe('now', () => {
    it('should return a Date', () => {
      expect(TemporalValue.now()).toBeInstanceOf(Date);
    });
  });

  describe('fromISO', () => {
    it('should parse a valid ISO string', () => {
      const date = TemporalValue.fromISO('2024-01-15T10:30:00.000Z');
      expect(date.getFullYear()).toBe(2024);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(15);
    });

    it('should throw on invalid ISO string', () => {
      expect(() => TemporalValue.fromISO('not-a-date')).toThrow('Invalid ISO date');
    });
  });

  describe('toISO', () => {
    it('should convert Date to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      expect(TemporalValue.toISO(date)).toBe('2024-01-15T10:30:00.000Z');
    });
  });
});
