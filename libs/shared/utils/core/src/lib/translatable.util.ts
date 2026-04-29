import { z } from 'zod/v4';
import type { Locale, TranslatableJson } from '@portfolio/shared/types';

/**
 * Resolve a translatable field to a single string.
 * Fallback chain: requested locale -> en -> first available -> empty string
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

/**
 * Validates an IANA timezone string using Intl.DateTimeFormat.
 */
export function isValidTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const TimezoneSchema = z.string().refine(isValidTimezone, {
  message: 'Invalid IANA timezone',
});
