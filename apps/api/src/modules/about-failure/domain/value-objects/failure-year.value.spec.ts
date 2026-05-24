import { FailureYear } from './failure-year.value';
import { ABOUT_FAILURE_LIMITS } from '../about-failure.types';

describe('FailureYear', () => {
  const currentYear = new Date().getFullYear();

  it('accepts the lower bound (YEAR_MIN)', () => {
    const y = FailureYear.create(ABOUT_FAILURE_LIMITS.YEAR_MIN);
    expect(y.value).toBe(ABOUT_FAILURE_LIMITS.YEAR_MIN);
  });

  it('accepts the current year', () => {
    const y = FailureYear.create(currentYear);
    expect(y.value).toBe(currentYear);
  });

  it('rejects a future year', () => {
    expect(() => FailureYear.create(currentYear + 1)).toThrow(
      `year must be between ${ABOUT_FAILURE_LIMITS.YEAR_MIN} and ${currentYear}`
    );
  });

  it('rejects a year before YEAR_MIN', () => {
    expect(() => FailureYear.create(ABOUT_FAILURE_LIMITS.YEAR_MIN - 1)).toThrow(
      `year must be between ${ABOUT_FAILURE_LIMITS.YEAR_MIN} and ${currentYear}`
    );
  });

  it('rejects a non-integer year', () => {
    expect(() => FailureYear.create(2021.5)).toThrow('year must be an integer');
  });
});
