import { BadRequestError, ErrorLayer, AboutPrincipleErrorCode } from '@portfolio/shared/errors';
import type { TranslatableJson } from '@portfolio/shared/types';
import { ABOUT_PRINCIPLE_LIMITS } from '../about-principle.types';

/**
 * Bilingual 2–3 sentence expansion of a claim. EN required; VI optional
 * (landing falls back to EN per-item). Cap of 1500 chars is generous but
 * stops the section from becoming an essay.
 */
export class PrincipleExpansion {
  private constructor(private readonly value: TranslatableJson) {
    Object.freeze(this);
  }

  static create(value: TranslatableJson): PrincipleExpansion {
    const en = (value.en ?? '').trim();
    const vi = (value.vi ?? '').trim();

    if (!en) {
      throw BadRequestError('expansion.en is required', {
        errorCode: AboutPrincipleErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (en.length > ABOUT_PRINCIPLE_LIMITS.EXPANSION_MAX) {
      throw BadRequestError(`expansion.en must be ≤ ${ABOUT_PRINCIPLE_LIMITS.EXPANSION_MAX} chars`, {
        errorCode: AboutPrincipleErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }
    if (vi.length > ABOUT_PRINCIPLE_LIMITS.EXPANSION_MAX) {
      throw BadRequestError(`expansion.vi must be ≤ ${ABOUT_PRINCIPLE_LIMITS.EXPANSION_MAX} chars`, {
        errorCode: AboutPrincipleErrorCode.INVALID_INPUT,
        layer: ErrorLayer.DOMAIN,
      });
    }

    return new PrincipleExpansion({ en, vi });
  }

  static fromPersistence(value: TranslatableJson): PrincipleExpansion {
    return new PrincipleExpansion({ en: value.en ?? '', vi: value.vi ?? '' });
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
