/** Returns a "GMT±N" string for the given IANA timezone, computed from now. */
export function formatOffset(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    return tz.replace(/^GMT([+-]?\d+)?$/, (_, n) => `GMT${n ?? '+0'}`);
  } catch {
    return 'GMT';
  }
}

/** "Asia/Ho_Chi_Minh" → "ICT". Falls back to the offset (e.g. "GMT+7") when no abbr is available. */
export function shortTimezoneLabel(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? formatOffset(timezone);
  } catch {
    return formatOffset(timezone);
  }
}

/**
 * Converts a "HH:mm" range from sourceTz → targetTz using today's date as the
 * reference (handles DST as of "now"). Returns `"HH:mm–HH:mm TZS"`.
 */
export function formatHoursInTimezone(start: string, end: string, sourceTz: string, targetTz: string): string {
  const ref = new Date();
  const startInTarget = convertWallClock(start, sourceTz, targetTz, ref);
  const endInTarget = convertWallClock(end, sourceTz, targetTz, ref);
  const tzShort = shortTimezoneLabel(targetTz);
  return `${startInTarget}–${endInTarget} ${tzShort}`;
}

/**
 * Treat `hhmm` as a wall-clock time in `sourceTz` today, then format the
 * equivalent wall-clock time in `targetTz`. Naive but good-enough for the
 * "what's 09:00 ICT in my zone" widget.
 */
export function convertWallClock(hhmm: string, sourceTz: string, targetTz: string, ref: Date): string {
  const [hh, mm] = hhmm.split(':').map(Number);
  const yyyy = ref.getUTCFullYear();
  const month = ref.getUTCMonth();
  const day = ref.getUTCDate();
  const utcCandidate = new Date(Date.UTC(yyyy, month, day, hh, mm));
  const sourceOffsetMin = offsetMinutes(utcCandidate, sourceTz);
  const instant = new Date(utcCandidate.getTime() - sourceOffsetMin * 60_000);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: targetTz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(instant);
}

/** Minutes east of UTC for the given IANA zone at instant `at`. */
export function offsetMinutes(at: Date, timezone: string): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  }).formatToParts(at);
  const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  const match = raw.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === '-' ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}
