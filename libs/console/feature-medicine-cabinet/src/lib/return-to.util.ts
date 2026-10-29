/** Returns `raw` only when it is an absolute URL on the landing origin, without userinfo; otherwise `null` (R16.6). */
export function safeReturnTo(raw: string | null | undefined, landingUrl: string): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const landing = new URL(landingUrl);
    if (url.username || url.password) return null;
    return url.origin === landing.origin ? raw : null;
  } catch {
    return null;
  }
}
