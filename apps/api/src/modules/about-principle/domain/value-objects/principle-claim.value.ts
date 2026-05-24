import { BadRequestError, ErrorLayer, AboutPrincipleErrorCode } from '@portfolio/shared/errors';
import type { TranslatableJson } from '@portfolio/shared/types';
import { ABOUT_PRINCIPLE_LIMITS } from '../about-principle.types';

/**
 * Bilingual one-line claim ("Complexity is a constraint, not a flex."). EN
 * required; VI optional (empty string allowed — landing falls back to EN
 * per-item). Hard cap keeps the layout terse — long claims break the
 * type-rhythm of the §03 list.
 */
export class PrincipleClaim {
  private constructor(private readonly value: TranslatableJson) {
    Object.freeze(this);
  }

  static create(value: TranslatableJson): PrincipleClaim {
    const en = (value.en ?? '').trim();
    const vi = (value.vi ?? '').trim();

    if (!en) {
      throw BadRequestError('claim.en is required', {
        errorCode: AboutPrincipleErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (en.length > ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX) {
      throw BadRequestError(`claim.en must be ≤ ${ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX} chars`, {
        errorCode: AboutPrincipleErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (vi.length > ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX) {
      throw BadRequestError(`claim.vi must be ≤ ${ABOUT_PRINCIPLE_LIMITS.CLAIM_MAX} chars`, {
        errorCode: AboutPrincipleErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }

    return new PrincipleClaim({ en, vi });
  }

  static fromPersistence(value: TranslatableJson): PrincipleClaim {
    return new PrincipleClaim({ en: value.en ?? '', vi: value.vi ?? '' });
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
