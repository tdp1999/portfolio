import { ValidatorFn, Validators } from '@angular/forms';
import { LIMITS } from '@portfolio/shared/validation';
import { integerValidator } from './integer.validator';
import { passwordValidator } from './password.validator';
import { urlValidator } from './url.validator';

/**
 * Per-input-type baseline `ValidatorFn[]` factories. A baseline is the **minimum set of
 * format/length/pattern validators** that must apply to every control of this type so the
 * FE rule mirrors the BE Zod atom.
 *
 * **`Validators.required` is intentionally NOT part of any baseline.** Required-ness is a
 * per-field semantic decision (same field can be required on one entity and optional on
 * another, e.g. Project.description vs Experience.description). Compose `Validators.required`
 * at the call site:
 *
 * ```ts
 * companyName: ['', [Validators.required, ...baselineFor.shortText()]],
 * companyUrl:  ['', baselineFor.url()], // optional
 * ```
 */
export const baselineFor = {
  /** Short text — companyName, project title, blog title (default cap = TITLE_MAX). */
  shortText(max: number = LIMITS.TITLE_MAX): ValidatorFn[] {
    return [Validators.maxLength(max)];
  },

  /** Long text — descriptions, content, motivation. Caller passes the per-field cap. */
  longText(max: number): ValidatorFn[] {
    return [Validators.maxLength(max)];
  },

  /** http(s) URL — applies pattern + URL_MAX. */
  url(): ValidatorFn[] {
    return [urlValidator(), Validators.maxLength(LIMITS.URL_MAX)];
  },

  /** Email — Angular email validator + EMAIL_MAX. */
  email(): ValidatorFn[] {
    return [Validators.email, Validators.maxLength(LIMITS.EMAIL_MAX)];
  },

  /** Phone — length-only; BE does not enforce a pattern. */
  phone(): ValidatorFn[] {
    return [Validators.maxLength(LIMITS.PHONE_MAX)];
  },

  /** Integer with optional bounds. Rejects decimals and non-numeric input. */
  integer(min?: number, max?: number): ValidatorFn[] {
    const validators: ValidatorFn[] = [integerValidator()];
    if (min !== undefined) validators.push(Validators.min(min));
    if (max !== undefined) validators.push(Validators.max(max));
    return validators;
  },

  /** Password matching BE `PasswordSchema` (complexity regex). */
  password(): ValidatorFn[] {
    return [passwordValidator()];
  },

  /** Postal code — length-only. */
  postalCode(): ValidatorFn[] {
    return [Validators.maxLength(LIMITS.POSTAL_CODE_MAX)];
  },

  /** Address line — length-only. */
  address(): ValidatorFn[] {
    return [Validators.maxLength(LIMITS.ADDRESS_MAX)];
  },

  /** SEO meta title — length-only (META_TITLE_MAX). */
  metaTitle(): ValidatorFn[] {
    return [Validators.maxLength(LIMITS.META_TITLE_MAX)];
  },

  /** SEO meta description — length-only (META_DESCRIPTION_MAX). */
  metaDescription(): ValidatorFn[] {
    return [Validators.maxLength(LIMITS.META_DESCRIPTION_MAX)];
  },

  /** Display order — integer with min(0). */
  displayOrder(): ValidatorFn[] {
    return [integerValidator(), Validators.min(LIMITS.DISPLAY_ORDER_MIN)];
  },

  /** Years of experience — integer in [YOE_MIN, YOE_MAX]. */
  yearsOfExperience(): ValidatorFn[] {
    return [integerValidator(), Validators.min(LIMITS.YOE_MIN), Validators.max(LIMITS.YOE_MAX)];
  },

  /** Certification year — integer in [CERT_YEAR_MIN, CERT_YEAR_MAX]. */
  certificationYear(): ValidatorFn[] {
    return [integerValidator(), Validators.min(LIMITS.CERT_YEAR_MIN), Validators.max(LIMITS.CERT_YEAR_MAX)];
  },
} as const;
