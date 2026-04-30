import { JwtSignOptions } from '@nestjs/jwt';

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

type JwtExpiry = NonNullable<JwtSignOptions['expiresIn']>;

export type AuthConfig = {
  jwtSecret: string;
  jwtAccessExpiry: JwtExpiry;
  jwtRefreshSecret: string;
  jwtRefreshExpiry: JwtExpiry;
};

function requireSecret(name: string, fallback: string): string {
  const value = process.env[name];
  if (value) return value;
  // Allow fallback only in dev/test so local boot and unit tests still work.
  // In any other env (incl. unset NODE_ENV on a deployed host) we fail fast
  // rather than silently signing tokens with a known string from git history.
  const env = process.env['NODE_ENV'];
  if (env === 'development' || env === 'test') return fallback;
  throw new Error(`${name} is required when NODE_ENV is "${env ?? '(unset)'}"`);
}

export const authConfigFactory: AuthConfig = {
  jwtSecret: requireSecret('JWT_SECRET', 'dev-secret-change-me'),
  jwtAccessExpiry: (process.env['JWT_ACCESS_EXPIRY'] || '15m') as JwtExpiry,
  jwtRefreshSecret: requireSecret('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me'),
  jwtRefreshExpiry: (process.env['JWT_REFRESH_EXPIRY'] || '30d') as JwtExpiry,
};
