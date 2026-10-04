/**
 * Narrowing helpers for `unknown` input: Prisma JSON columns, third-party payloads, HTTP error
 * bodies. Each returns a typed value or a neutral fallback instead of throwing, so a mapper can
 * read loosely shaped data field by field.
 */

/** A non-null, non-array object whose keys can be read safely. */
export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The string itself when it is non-empty, otherwise `null`. */
export const nonEmptyString = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

/** The number itself when it is finite, otherwise `null` (rejects `NaN` and `Infinity`). */
export const finiteNumber = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

/** The string entries of an array; anything that is not an array yields `[]`. */
export const stringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];
