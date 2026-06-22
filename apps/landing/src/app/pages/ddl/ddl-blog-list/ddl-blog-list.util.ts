/**
 * Locale-aware "time ago" formatter via `Intl.RelativeTimeFormat`.
 * Falls back to "—" if the date is unparseable. Reads largest non-zero
 * unit (year → month → week → day → hour → minute), else "just now".
 * Kept local — if a second consumer appears, graduate to a shared pipe.
 */
export function timeAgo(iso: string | null, locale: 'en' | 'vi'): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '—';
  const deltaSec = Math.round((then - Date.now()) / 1000);
  const abs = Math.abs(deltaSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const units: ReadonlyArray<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['week', 60 * 60 * 24 * 7],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ];
  for (const [unit, sec] of units) {
    if (abs >= sec) {
      return rtf.format(Math.round(deltaSec / sec), unit);
    }
  }
  return rtf.format(0, 'second');
}

export function dateMs(iso: string | null): number {
  if (!iso) return 0;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : 0;
}
