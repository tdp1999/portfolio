import type { Locale, TranslatableJson } from '@portfolio/shared/types';

/**
 * Resolve a translatable field to a single string.
 * Fallback chain: requested locale -> en -> first available -> empty string.
 *
 * Kept in its own file (no `zod` import) so the lightweight `@portfolio/shared/utils/lite`
 * subpath can re-export it without dragging the validation barrel into landing's
 * initial JS bundle. See `core/src/lite.ts`.
 */
export function getLocalized(
  field: TranslatableJson | Partial<TranslatableJson> | null | undefined,
  locale: Locale
): string {
  if (!field) return '';

  if (field[locale]) return field[locale];
  if (field.en) return field.en;

  const values = Object.values(field).filter(Boolean);
  return values.length > 0 ? values[0] : '';
}
