import { WorkingHours } from './working-hours';

describe('WorkingHours VO', () => {
  describe('create() — validation', () => {
    it('accepts a valid HH:mm range', () => {
      const vo = WorkingHours.create({ start: '09:00', end: '18:00' });
      expect(vo.start).toBe('09:00');
      expect(vo.end).toBe('18:00');
    });

    it('accepts boundary times (00:00 → 23:59)', () => {
      expect(() => WorkingHours.create({ start: '00:00', end: '23:59' })).not.toThrow();
    });

    it('rejects malformed start', () => {
      expect(() => WorkingHours.create({ start: '9:00', end: '18:00' })).toThrow(
        'workingHours.start must be HH:mm (00:00–23:59)'
      );
    });

    it('rejects malformed end', () => {
      expect(() => WorkingHours.create({ start: '09:00', end: '24:00' })).toThrow(
        'workingHours.end must be HH:mm (00:00–23:59)'
      );
    });

    it('rejects end <= start', () => {
      expect(() => WorkingHours.create({ start: '18:00', end: '09:00' })).toThrow(
        'workingHours.end must be after workingHours.start'
      );
      expect(() => WorkingHours.create({ start: '09:00', end: '09:00' })).toThrow(
        'workingHours.end must be after workingHours.start'
      );
    });
  });

  describe('toJSON / equals / immutability', () => {
    it('serializes to a plain object', () => {
      const vo = WorkingHours.create({ start: '09:00', end: '18:00' });
      expect(vo.toJSON()).toEqual({ start: '09:00', end: '18:00' });
    });

    it('compares two instances structurally', () => {
      const a = WorkingHours.create({ start: '09:00', end: '18:00' });
      const b = WorkingHours.create({ start: '09:00', end: '18:00' });
      const c = WorkingHours.create({ start: '08:00', end: '17:00' });
      expect(a.equals(b)).toBe(true);
      expect(a.equals(c)).toBe(false);
    });

    it('is frozen', () => {
      expect(Object.isFrozen(WorkingHours.create({ start: '09:00', end: '18:00' }))).toBe(true);
    });
  });
});
