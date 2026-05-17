import { z } from 'zod/v4';

// `getLocalized` lives in `./localize.util` so the lite subpath can expose it
// without pulling zod. Re-export here for backwards-compat with the main barrel.
export { getLocalized } from './localize.util';

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
