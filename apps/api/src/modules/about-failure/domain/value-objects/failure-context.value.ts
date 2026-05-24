import { BadRequestError, ErrorLayer, AboutFailureErrorCode } from '@portfolio/shared/errors';
import type { TranslatableJson } from '@portfolio/shared/types';
import { ABOUT_FAILURE_LIMITS } from '../about-failure.types';

/**
 * Bilingual anonymized context label ("At a B2B SaaS · team of 8"). EN
 * required; VI optional (empty string allowed — landing falls back to EN
 * per-item). Single-line cap of 200 chars keeps the card header terse —
 * long context blurs the year+context scan line.
 */
export class FailureContext {
  private constructor(private readonly value: TranslatableJson) {
    Object.freeze(this);
  }

  static create(value: TranslatableJson): FailureContext {
    const en = (value.en ?? '').trim();
    const vi = (value.vi ?? '').trim();

    if (!en) {
      throw BadRequestError('context.en is required', {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (en.length > ABOUT_FAILURE_LIMITS.CONTEXT_MAX) {
      throw BadRequestError(`context.en must be ≤ ${ABOUT_FAILURE_LIMITS.CONTEXT_MAX} chars`, {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (vi.length > ABOUT_FAILURE_LIMITS.CONTEXT_MAX) {
      throw BadRequestError(`context.vi must be ≤ ${ABOUT_FAILURE_LIMITS.CONTEXT_MAX} chars`, {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }

    return new FailureContext({ en, vi });
  }

  static fromPersistence(value: TranslatableJson): FailureContext {
    return new FailureContext({ en: value.en ?? '', vi: value.vi ?? '' });
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
