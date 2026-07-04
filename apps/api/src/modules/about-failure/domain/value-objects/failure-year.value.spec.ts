import { FailureYear } from './failure-year.value';
import { LIMITS } from '@portfolio/shared/validation';

describe('FailureYear', () => {
  const currentYear = new Date().getFullYear();

  it('accepts the lower bound (YEAR_MIN)', () => {
    const y = FailureYear.create(LIMITS.FAILURE_YEAR_MIN);
    expect(y.value).toBe(LIMITS.FAILURE_YEAR_MIN);
  });

  it('accepts the current year', () => {
    const y = FailureYear.create(currentYear);
    expect(y.value).toBe(currentYear);
  });

  it('rejects a future year', () => {
    expect(() => FailureYear.create(currentYear + 1)).toThrow(
      `year must be between ${LIMITS.FAILURE_YEAR_MIN} and ${currentYear}`
    );
  });

  it('rejects a year before YEAR_MIN', () => {
    expect(() => FailureYear.create(LIMITS.FAILURE_YEAR_MIN - 1)).toThrow(
      `year must be between ${LIMITS.FAILURE_YEAR_MIN} and ${currentYear}`
    );
  });

  it('rejects a non-integer year', () => {
    expect(() => FailureYear.create(2021.5)).toThrow('year must be an integer');
  });
});
