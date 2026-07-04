import { BadRequestError, ErrorLayer, AboutFailureErrorCode } from '@portfolio/shared/errors';
import { LIMITS } from '@portfolio/shared/validation';

/**
 * Integer year tag (e.g., 2021) anchoring a failure to a moment in the
 * author's career. Must be a 4-digit integer between YEAR_MIN (2000) and
 * the current year inclusive. The upper bound is computed lazily so the
 * limit drifts with the calendar without code change.
 */
export class FailureYear {
  private constructor(readonly value: number) {
    Object.freeze(this);
  }

  static create(value: number): FailureYear {
    if (!Number.isInteger(value)) {
      throw BadRequestError('year must be an integer', {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    const currentYear = new Date().getFullYear();
    if (value < LIMITS.FAILURE_YEAR_MIN || value > currentYear) {
      throw BadRequestError(`year must be between ${LIMITS.FAILURE_YEAR_MIN} and ${currentYear}`, {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    return new FailureYear(value);
  }

  static fromPersistence(value: number): FailureYear {
    return new FailureYear(value);
  }
}
