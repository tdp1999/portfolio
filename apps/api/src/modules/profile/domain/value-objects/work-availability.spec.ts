import { WorkAvailability } from './work-availability';

describe('WorkAvailability VO', () => {
  const validProps = {
    yearsOfExperience: 8,
    availability: 'EMPLOYED' as const,
    openTo: ['FREELANCE' as const],
    timezones: [],
    workingHours: null,
  };

  describe('create() — validation guards', () => {
    it('should allow zero years of experience (boundary)', () => {
      expect(() => WorkAvailability.create({ ...validProps, yearsOfExperience: 0 })).not.toThrow();
    });

    it('should reject negative yearsOfExperience', () => {
      expect(() => WorkAvailability.create({ ...validProps, yearsOfExperience: -1 })).toThrow(
        'yearsOfExperience must be >= 0'
      );
    });

    it('should reject non-integer yearsOfExperience', () => {
      expect(() => WorkAvailability.create({ ...validProps, yearsOfExperience: 5.5 })).toThrow(
        'yearsOfExperience must be an integer'
      );
    });
  });

  describe('isOpenToWork', () => {
    it('should return true when OPEN_TO_WORK regardless of openTo', () => {
      const vo = WorkAvailability.create({ ...validProps, availability: 'OPEN_TO_WORK', openTo: [] });

      expect(vo.isOpenToWork).toBe(true);
    });

    it('should return true when EMPLOYED with non-empty openTo', () => {
      const vo = WorkAvailability.create({ ...validProps, availability: 'EMPLOYED', openTo: ['FREELANCE'] });

      expect(vo.isOpenToWork).toBe(true);
    });

    it('should return false when EMPLOYED with empty openTo', () => {
      const vo = WorkAvailability.create({ ...validProps, availability: 'EMPLOYED', openTo: [] });

      expect(vo.isOpenToWork).toBe(false);
    });

    it('should return false when NOT_AVAILABLE', () => {
      const vo = WorkAvailability.create({ ...validProps, availability: 'NOT_AVAILABLE', openTo: ['FREELANCE'] });

      expect(vo.isOpenToWork).toBe(false);
    });
  });

  describe('timezones', () => {
    it('should default to empty list when none specified', () => {
      const vo = WorkAvailability.create({ ...validProps, timezones: [] });

      expect(vo.timezones).toEqual([]);
    });

    it('should preserve multiple timezones', () => {
      const vo = WorkAvailability.create({
        ...validProps,
        timezones: ['Asia/Ho_Chi_Minh', 'Europe/London'],
      });

      expect(vo.timezones).toEqual(['Asia/Ho_Chi_Minh', 'Europe/London']);
    });

    it('should treat different timezone lists as not equal', () => {
      const a = WorkAvailability.create({ ...validProps, timezones: ['Asia/Ho_Chi_Minh'] });
      const b = WorkAvailability.create({ ...validProps, timezones: ['Europe/London'] });

      expect(a.equals(b)).toBe(false);
    });

    it('should treat same timezone lists as equal', () => {
      const a = WorkAvailability.create({ ...validProps, timezones: ['Asia/Ho_Chi_Minh'] });
      const b = WorkAvailability.create({ ...validProps, timezones: ['Asia/Ho_Chi_Minh'] });

      expect(a.equals(b)).toBe(true);
    });
  });

  describe('immutability', () => {
    it('should be frozen', () => {
      expect(Object.isFrozen(WorkAvailability.create(validProps))).toBe(true);
    });
  });
});
