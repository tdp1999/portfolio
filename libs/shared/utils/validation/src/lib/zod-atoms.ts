/**
 * BE-only Zod atoms — pre-baked schema fragments derived from `LIMITS` + `PATTERNS`.
 *
 * Atoms live behind the `@portfolio/shared/validation/zod` sub-entry so the FE bundle
 * never pulls Zod. **Do not import from this file inside FE code.**
 *
 * Conventions
 * - "Required" atoms use `.min(1)` and strip-then-trim string transforms.
 * - "Optional" / no-min atoms have only `.max(...)` and the transform.
 * - Numeric atoms enforce `int` and the appropriate `[min, max]` from `LIMITS`.
 *
 * Caps reflect the canonical values from the validation epic ADRs.
 */
import { z } from 'zod/v4';
import { stripHtmlTags } from '@portfolio/shared/utils';
import { LIMITS } from './limits';
import { PATTERNS } from './patterns';

const trimAndStrip = (v: string): string => stripHtmlTags(v.trim());

// --- Strings: required (with min(1)) ---

export const TitleSchema = z.string().min(1).max(LIMITS.TITLE_MAX).transform(trimAndStrip);
export const NameSchema = z.string().min(1).max(LIMITS.NAME_MAX).transform(trimAndStrip);
export const TagNameSchema = z.string().min(1).max(LIMITS.TAG_NAME_MAX).transform(trimAndStrip);
export const DescriptionShortSchema = z.string().min(1).max(LIMITS.DESCRIPTION_SHORT_MAX).transform(trimAndStrip);
export const DescriptionLongSchema = z.string().min(1).max(LIMITS.DESCRIPTION_LONG_MAX).transform(trimAndStrip);

/** Generic factory for required short text fields not covered by a named atom above. */
export const requiredShortText = (max: number = LIMITS.TITLE_MAX) => z.string().min(1).max(max).transform(trimAndStrip);

// --- Strings: optional (no min) ---

export const ExcerptSchema = z.string().max(LIMITS.DESCRIPTION_SHORT_MAX).transform(trimAndStrip);
export const BioShortSchema = z.string().max(LIMITS.BIO_SHORT_MAX).transform(trimAndStrip);
export const MetaTitleSchema = z.string().max(LIMITS.META_TITLE_MAX).transform(trimAndStrip);
export const MetaDescriptionSchema = z.string().max(LIMITS.META_DESCRIPTION_MAX).transform(trimAndStrip);

/** Optional generic short text — no min, strip+trim. */
export const optionalShortText = (max: number) => z.string().max(max).transform(trimAndStrip);

// --- URL / Email / Phone ---

/** http(s) URL with the canonical max length. Uses Zod's URL parser, not `PATTERNS.URL`. */
export const UrlSchema = z.url().max(LIMITS.URL_MAX);

/** Email lowercased + capped at EMAIL_MAX (RFC 5321 practical). */
export const EmailSchema = z
  .email()
  .max(LIMITS.EMAIL_MAX)
  .transform((v) => v.toLowerCase());

export const PhoneSchema = z.string().max(LIMITS.PHONE_MAX);
export const PostalCodeSchema = z.string().max(LIMITS.POSTAL_CODE_MAX);
export const AddressLineSchema = z.string().max(LIMITS.ADDRESS_MAX);

// --- Integers ---

/** Integer in `[min, max?]`. Pass `max` to bound on the right. */
export const integerSchema = (min: number, max?: number) => {
  const base = z.number().int().min(min);
  return max === undefined ? base : base.max(max);
};

/** Intentionally unbounded on the right — no business cap defined for team size. */
export const TeamSizeSchema = integerSchema(LIMITS.TEAM_SIZE_MIN);
export const DisplayOrderSchema = integerSchema(LIMITS.DISPLAY_ORDER_MIN);
export const YearsOfExperienceSchema = integerSchema(LIMITS.YOE_MIN, LIMITS.YOE_MAX);
export const CertificationYearSchema = integerSchema(LIMITS.CERT_YEAR_MIN, LIMITS.CERT_YEAR_MAX);

// --- Dates ---

/**
 * Optional, nullable, coerced date.
 *
 * Use this for "end date" / "completed at" style fields. Plain `z.coerce.date().optional()`
 * is a footgun — `new Date(null)` returns the epoch, so a `null` payload silently coerces
 * to `1970-01-01` instead of being rejected or treated as absent.
 */
export const OptionalDateSchema = z.coerce.date().nullable().optional();

/**
 * Refines an object schema so `<start>` is strictly before `<end>` when both are set.
 * `null`/`undefined` on either side short-circuits to true.
 *
 * Defaults to `startDate` / `endDate`. Override `start`/`end` for non-standard names.
 * The error is attached at `path: [end]` so it surfaces on the end-date field.
 */
export const withDateRange = <T extends z.ZodTypeAny>(
  schema: T,
  opts: { start?: string; end?: string; message?: string } = {}
) => {
  const start = opts.start ?? 'startDate';
  const end = opts.end ?? 'endDate';
  return schema.refine(
    (v) => {
      const s = (v as Record<string, unknown>)[start];
      const e = (v as Record<string, unknown>)[end];
      if (!s || !e) return true;
      const sd = s instanceof Date ? s : new Date(s as string);
      const ed = e instanceof Date ? e : new Date(e as string);
      return sd < ed;
    },
    { message: opts.message ?? `${start} must be before ${end}`, path: [end] }
  );
};

// --- Password ---

const PASSWORD_ERROR =
  'Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character (#?!@$%^&*-)';

export const PasswordSchema = z.string().regex(PATTERNS.PASSWORD, PASSWORD_ERROR);
