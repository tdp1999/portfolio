import type { Locale } from '@portfolio/shared/types';

/**
 * Locale-aware date labels for landing.
 *
 * These live next to the copy dictionary rather than in it because month names
 * are **index-addressed** — a flat key map would need `common.month.5` and lose
 * the closed-union key safety that makes the dictionary worth having.
 *
 * Two rules hold across every formatter here:
 *
 * 1. **UTC getters, never `toLocaleDateString`.** The server and the browser can
 *    sit in different time zones, so a locale-formatted local date is a
 *    hydration mismatch waiting to happen (and silently shifts by a day for
 *    readers west of the server). Reading UTC parts makes both sides agree.
 * 2. **No en-dash.** `–` is visually confusable with an ASCII hyphen in source
 *    and trips the editor's ambiguous-character warning, so ranges use a plain
 *    hyphen in English and the word `tới` in Vietnamese.
 */

const EN_MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const EN_MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

/** Vietnamese does not abbreviate month names, so one array serves both styles. */
const VI_MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
] as const;

function monthName(monthIndex: number, locale: Locale, style: 'long' | 'short'): string {
  if (locale === 'vi') return VI_MONTHS[monthIndex];
  return style === 'short' ? EN_MONTHS_SHORT[monthIndex] : EN_MONTHS_LONG[monthIndex];
}

/**
 * `May 2024` / `Tháng 5 2024` (long) — `May 2024` / `Tháng 5 2024` (short EN
 * abbreviates to `May`). Used by the About hero's "Last updated" strip and by
 * every experience date range.
 */
export function formatMonthYear(date: Date, locale: Locale, style: 'long' | 'short' = 'long'): string {
  if (!Number.isFinite(date.getTime())) return '';
  return `${monthName(date.getUTCMonth(), locale, style)} ${date.getUTCFullYear()}`;
}

/**
 * `May 3, 2026` / `3 tháng 5, 2026`. Day-level label for blog publish dates.
 * Vietnamese puts the day first and lowercases `tháng` mid-phrase, so it is
 * built here rather than reusing {@link VI_MONTHS} verbatim.
 */
export function formatLongDate(date: Date, locale: Locale): string {
  if (!Number.isFinite(date.getTime())) return '';
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  if (locale === 'vi') return `${day} tháng ${date.getUTCMonth() + 1}, ${year}`;
  return `${EN_MONTHS_LONG[date.getUTCMonth()]} ${day}, ${year}`;
}

/**
 * `Jan 2021 - Apr 2024` / `Tháng 1 2021 tới Tháng 4 2024`. `endLabel` carries
 * the already-resolved "Present" copy so this stays free of dictionary lookups.
 */
export function formatMonthRange(start: Date, end: Date | null, locale: Locale, endLabel: string): string {
  const from = formatMonthYear(start, locale, 'short');
  const to = end ? formatMonthYear(end, locale, 'short') : endLabel;
  return locale === 'vi' ? `${from} tới ${to}` : `${from} - ${to}`;
}
