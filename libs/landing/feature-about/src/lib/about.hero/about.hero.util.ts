/**
 * IANA timezone → "GMT+7" string via `Intl.DateTimeFormat('shortOffset')`.
 * Normalizes "GMT" (offset 0) and "GMT+7" alike so the meta strip stays
 * consistent. Falls back to the literal "GMT" on browsers without `shortOffset`
 * support — Safari < 15.4 territory; acceptable for a meta-strip glyph.
 */
export function formatOffset(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date());
    const tz = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
    return tz.replace(/^GMT([+-]?\d+)?$/, (_, n) => `GMT${n ?? '+0'}`);
  } catch {
    return 'GMT';
  }
}
