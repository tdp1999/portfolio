/**
 * Curated IANA timezone list grouped by region. Browsers do expose
 * `Intl.supportedValuesOf('timeZone')` (~400 zones), but a curated set
 * keeps the UI scannable and SSR/client output identical.
 */
export interface TimezoneOption {
  value: string;
  city: string;
  region: string;
}

export const DEFAULT_TIMEZONES: readonly TimezoneOption[] = [
  // ── Asia ────────────────────────────────────────────────
  { value: 'Asia/Ho_Chi_Minh', city: 'Ho Chi Minh City', region: 'Asia' },
  { value: 'Asia/Bangkok', city: 'Bangkok', region: 'Asia' },
  { value: 'Asia/Singapore', city: 'Singapore', region: 'Asia' },
  { value: 'Asia/Kuala_Lumpur', city: 'Kuala Lumpur', region: 'Asia' },
  { value: 'Asia/Jakarta', city: 'Jakarta', region: 'Asia' },
  { value: 'Asia/Manila', city: 'Manila', region: 'Asia' },
  { value: 'Asia/Hong_Kong', city: 'Hong Kong', region: 'Asia' },
  { value: 'Asia/Shanghai', city: 'Shanghai', region: 'Asia' },
  { value: 'Asia/Taipei', city: 'Taipei', region: 'Asia' },
  { value: 'Asia/Tokyo', city: 'Tokyo', region: 'Asia' },
  { value: 'Asia/Seoul', city: 'Seoul', region: 'Asia' },
  { value: 'Asia/Kolkata', city: 'Kolkata', region: 'Asia' },
  { value: 'Asia/Dubai', city: 'Dubai', region: 'Asia' },

  // ── Europe ──────────────────────────────────────────────
  { value: 'Europe/London', city: 'London', region: 'Europe' },
  { value: 'Europe/Dublin', city: 'Dublin', region: 'Europe' },
  { value: 'Europe/Paris', city: 'Paris', region: 'Europe' },
  { value: 'Europe/Berlin', city: 'Berlin', region: 'Europe' },
  { value: 'Europe/Amsterdam', city: 'Amsterdam', region: 'Europe' },
  { value: 'Europe/Madrid', city: 'Madrid', region: 'Europe' },
  { value: 'Europe/Rome', city: 'Rome', region: 'Europe' },
  { value: 'Europe/Stockholm', city: 'Stockholm', region: 'Europe' },
  { value: 'Europe/Helsinki', city: 'Helsinki', region: 'Europe' },
  { value: 'Europe/Moscow', city: 'Moscow', region: 'Europe' },
  { value: 'Europe/Istanbul', city: 'Istanbul', region: 'Europe' },

  // ── Americas ────────────────────────────────────────────
  { value: 'America/New_York', city: 'New York', region: 'Americas' },
  { value: 'America/Toronto', city: 'Toronto', region: 'Americas' },
  { value: 'America/Chicago', city: 'Chicago', region: 'Americas' },
  { value: 'America/Denver', city: 'Denver', region: 'Americas' },
  { value: 'America/Los_Angeles', city: 'Los Angeles', region: 'Americas' },
  { value: 'America/Vancouver', city: 'Vancouver', region: 'Americas' },
  { value: 'America/Mexico_City', city: 'Mexico City', region: 'Americas' },
  { value: 'America/Bogota', city: 'Bogotá', region: 'Americas' },
  { value: 'America/Sao_Paulo', city: 'São Paulo', region: 'Americas' },
  { value: 'America/Buenos_Aires', city: 'Buenos Aires', region: 'Americas' },

  // ── Oceania ─────────────────────────────────────────────
  { value: 'Australia/Sydney', city: 'Sydney', region: 'Oceania' },
  { value: 'Australia/Melbourne', city: 'Melbourne', region: 'Oceania' },
  { value: 'Australia/Perth', city: 'Perth', region: 'Oceania' },
  { value: 'Pacific/Auckland', city: 'Auckland', region: 'Oceania' },

  // ── Africa ──────────────────────────────────────────────
  { value: 'Africa/Cairo', city: 'Cairo', region: 'Africa' },
  { value: 'Africa/Johannesburg', city: 'Johannesburg', region: 'Africa' },
  { value: 'Africa/Lagos', city: 'Lagos', region: 'Africa' },
  { value: 'Africa/Nairobi', city: 'Nairobi', region: 'Africa' },

  // ── UTC ─────────────────────────────────────────────────
  { value: 'UTC', city: 'UTC', region: 'UTC' },
];

export const REGION_ORDER: readonly string[] = ['Asia', 'Europe', 'Americas', 'Oceania', 'Africa', 'UTC'];

/** Returns "GMT±N" or "GMT±N:MM" for the IANA zone at instant `at`. */
export function formatGmtOffset(timezone: string, at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(at);
    const raw = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    // Normalise "GMT" → "GMT+0".
    return raw === 'GMT' ? 'GMT+0' : raw;
  } catch {
    return 'GMT';
  }
}
