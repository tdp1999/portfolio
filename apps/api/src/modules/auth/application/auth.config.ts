export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

export type AuthConfig = {
  jwtSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshSecret: string;
  jwtRefreshExpiry: string;
};

export const authConfigFactory: AuthConfig = {
  jwtSecret: process.env['JWT_SECRET'] || 'dev-secret-change-me',
  jwtAccessExpiry: process.env['JWT_ACCESS_EXPIRY'] || '15m',
  jwtRefreshSecret: process.env['JWT_REFRESH_SECRET'] || 'dev-refresh-secret-change-me',
  jwtRefreshExpiry: process.env['JWT_REFRESH_EXPIRY'] || '30d',
};
