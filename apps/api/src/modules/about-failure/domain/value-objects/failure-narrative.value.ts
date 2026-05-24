import { BadRequestError, ErrorLayer, AboutFailureErrorCode } from '@portfolio/shared/errors';
import type { TranslatableJson } from '@portfolio/shared/types';
import { ABOUT_FAILURE_LIMITS } from '../about-failure.types';

/**
 * Bilingual long-form narrative beat — used for `decision`, `consequence`,
 * and `lesson`. All three share the same shape (EN required, VI optional,
 * each ≤ 1500 chars), so they collapse into one VO parameterized by the
 * field name for error reporting. The cap of 1500 chars is generous but
 * stops a single beat from drifting into essay length.
 */
export class FailureNarrative {
  private constructor(
    readonly fieldName: 'decision' | 'consequence' | 'lesson',
    private readonly value: TranslatableJson
  ) {
    Object.freeze(this);
  }

  static create(value: TranslatableJson, fieldName: 'decision' | 'consequence' | 'lesson'): FailureNarrative {
    const en = (value.en ?? '').trim();
    const vi = (value.vi ?? '').trim();

    if (!en) {
      throw BadRequestError(`${fieldName}.en is required`, {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (en.length > ABOUT_FAILURE_LIMITS.NARRATIVE_MAX) {
      throw BadRequestError(`${fieldName}.en must be ≤ ${ABOUT_FAILURE_LIMITS.NARRATIVE_MAX} chars`, {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (vi.length > ABOUT_FAILURE_LIMITS.NARRATIVE_MAX) {
      throw BadRequestError(`${fieldName}.vi must be ≤ ${ABOUT_FAILURE_LIMITS.NARRATIVE_MAX} chars`, {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }

    return new FailureNarrative(fieldName, { en, vi });
  }

  static fromPersistence(value: TranslatableJson, fieldName: 'decision' | 'consequence' | 'lesson'): FailureNarrative {
    return new FailureNarrative(fieldName, { en: value.en ?? '', vi: value.vi ?? '' });
  }

  get en(): string {
    return this.value.en;
  }

  get vi(): string {
    return this.value.vi;
  }

  toProps(): TranslatableJson {
    return { en: this.value.en, vi: this.value.vi };
  }
}
