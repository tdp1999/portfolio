const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/** Compact relative format ("3 hours ago", "just now", "in 2 days"). */
export function formatRelative(value: Date | string | number, now: Date = new Date()): string {
  const date = toDate(value);
  if (!date) return '';

  const diff = now.getTime() - date.getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;

  if (abs < 45 * SECOND) return 'just now';

  const [n, unit] = pickUnit(abs);
  const plural = n === 1 ? unit : `${unit}s`;
  return future ? `in ${n} ${plural}` : `${n} ${plural} ago`;
}

/** Verbose breakdown like "3 hours 14 minutes" (drops trailing zero parts). */
export function formatRelativeFull(value: Date | string | number, now: Date = new Date()): string {
  const date = toDate(value);
  if (!date) return '';

  const diff = now.getTime() - date.getTime();
  const abs = Math.abs(diff);
  const future = diff < 0;

  if (abs < 45 * SECOND) return 'just now';

  const parts = breakdown(abs);
  const text = parts.slice(0, 2).join(' ');
  return future ? `in ${text}` : `${text} ago`;
}

/** "April 20, 2026 at 2:32 PM" — locale-friendly absolute. */
export function formatAbsolute(value: Date | string | number): string {
  const date = toDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/** Returns true if the value is fresh enough to warrant 60s auto-refresh in UI. */
export function isFresh(value: Date | string | number, now: Date = new Date()): boolean {
  const date = toDate(value);
  if (!date) return false;
  return Math.abs(now.getTime() - date.getTime()) < HOUR;
}

function toDate(value: Date | string | number): Date | null {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isFinite(d.getTime()) ? d : null;
}

function pickUnit(abs: number): [number, string] {
  if (abs < MINUTE) return [Math.max(1, Math.round(abs / SECOND)), 'second'];
  if (abs < HOUR) return [Math.round(abs / MINUTE), 'minute'];
  if (abs < DAY) return [Math.round(abs / HOUR), 'hour'];
  if (abs < WEEK) return [Math.round(abs / DAY), 'day'];
  if (abs < MONTH) return [Math.round(abs / WEEK), 'week'];
  if (abs < YEAR) return [Math.round(abs / MONTH), 'month'];
  return [Math.round(abs / YEAR), 'year'];
}

function breakdown(abs: number): string[] {
  const out: string[] = [];
  let remaining = abs;
  const units: [number, string][] = [
    [YEAR, 'year'],
    [MONTH, 'month'],
    [WEEK, 'week'],
    [DAY, 'day'],
    [HOUR, 'hour'],
    [MINUTE, 'minute'],
    [SECOND, 'second'],
  ];
  for (const [size, name] of units) {
    if (remaining < size) continue;
    const n = Math.floor(remaining / size);
    remaining -= n * size;
    out.push(`${n} ${n === 1 ? name : `${name}s`}`);
    if (out.length >= 2) break;
  }
  return out.length ? out : ['just now'];
}
