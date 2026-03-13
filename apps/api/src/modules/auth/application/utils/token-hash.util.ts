import { createHash, timingSafeEqual } from 'crypto';

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function compareRefreshTokens(plainToken: string, hashedToken: string): boolean {
  const hashed = hashRefreshToken(plainToken);
  const a = Buffer.from(hashed, 'hex');
  const b = Buffer.from(hashedToken, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
