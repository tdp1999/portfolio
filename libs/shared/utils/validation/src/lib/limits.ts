/**
 * Cross-runtime numeric limits — single source of truth for FE Validators and BE Zod atoms.
 *
 * Caps were derived from the validation audit and the BE inconsistency ADRs:
 * - yoe.max: 99 (Skill aligned to Profile)
 * - displayOrder.min: 0 everywhere
 * - metaTitle.max: 70 site-wide (SEO-correct)
 * - metaDescription.max: 160 site-wide (SEO-correct)
 * - Tag.name.max: 50 (BE was canonical)
 *
 * See `.context/decisions.md` and `.context/investigations/inv-console-validation-audit.md`.
 */
export const LIMITS = {
  // Short titles — companyName, project title, blog title
  TITLE_MAX: 200,

  // Short names — skill/category/tag links labels, locationCountry/City, domain
  NAME_MAX: 100,

  // Tag.name has a tighter cap than other names
  TAG_NAME_MAX: 50,

  // Bio short
  BIO_SHORT_MAX: 200,

  // Description / excerpt buckets
  DESCRIPTION_SHORT_MAX: 500,
  DESCRIPTION_LONG_MAX: 1000,

  // URLs
  URL_MAX: 500,

  // Email (RFC 5321 practical cap)
  EMAIL_MAX: 320,

  // Phone (digits + separators)
  PHONE_MAX: 20,

  // Address
  POSTAL_CODE_MAX: 20,
  ADDRESS_MAX: 300,

  // SEO
  META_TITLE_MAX: 70,
  META_DESCRIPTION_MAX: 160,

  // Years of experience
  YOE_MIN: 0,
  YOE_MAX: 99,

  // Display order — non-negative everywhere
  DISPLAY_ORDER_MIN: 0,

  // Certification year
  CERT_YEAR_MIN: 1990,
  CERT_YEAR_MAX: 2100,

  // Team size
  TEAM_SIZE_MIN: 1,

  // Array caps
  SOCIAL_LINKS_ARRAY_MAX: 20,
  CERTIFICATIONS_ARRAY_MAX: 50,
  PROJECT_HIGHLIGHTS_ARRAY_MAX: 4,

  // Password
  PASSWORD_MIN: 8,
} as const;

export type Limits = typeof LIMITS;
