import { JwtSignOptions } from '@nestjs/jwt';

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

type JwtExpiry = NonNullable<JwtSignOptions['expiresIn']>;

export type AuthConfig = {
  jwtSecret: string;
  jwtAccessExpiry: JwtExpiry;
  jwtRefreshSecret: string;
  jwtRefreshExpiry: JwtExpiry;
};

export const authConfigFactory: AuthConfig = {
  jwtSecret: process.env['JWT_SECRET'] || 'dev-secret-change-me',
  jwtAccessExpiry: (process.env['JWT_ACCESS_EXPIRY'] || '15m') as JwtExpiry,
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'] || 'dev-refresh-secret-change-me',
  jwtRefreshExpiry: (process.env['JWT_REFRESH_EXPIRY'] || '30d') as JwtExpiry,
};
