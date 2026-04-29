/**
 * Cross-runtime regex patterns. Used as `Validators.pattern(...)` on FE and `z.string().regex(...)` on BE.
 *
 * Note: BE URL validation prefers `z.url()` over `PATTERNS.URL` because Zod runs a real URL parser.
 * `PATTERNS.URL` exists for FE Validators where we have no parser equivalent.
 */
export const PATTERNS = {
  /** http(s):// followed by at least one non-whitespace character. Matches the existing FE check. */
  URL: /^https?:\/\/\S+$/,

  /** lowercase alphanumerics with hyphen separators (no leading/trailing hyphen). */
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,

  /** ≥8 chars, with at least one upper, one lower, one digit, one special. */
  PASSWORD: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/,
} as const;

export type Patterns = typeof PATTERNS;
