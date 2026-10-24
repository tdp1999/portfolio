import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { randomBytes } from 'crypto';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/auth/refresh';
const CSRF_COOKIE_NAME = 'csrf_token';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const IS_DEV = process.env['NODE_ENV'] === 'development';
const COOKIE_DOMAIN = process.env['COOKIE_DOMAIN']?.trim() || undefined;
const CROSS_ORIGIN = !IS_DEV && !!COOKIE_DOMAIN;

@Injectable()
export class AuthCookieService {
  setRefreshToken(res: Response, refreshToken: string, rememberMe: boolean): void {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: !IS_DEV,
      sameSite: CROSS_ORIGIN ? 'none' : 'lax',
      path: REFRESH_COOKIE_PATH,
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
      ...(rememberMe ? { maxAge: THIRTY_DAYS_MS } : {}),
    });
  }

  /**
   * `/refresh` needs this cookie too (`CsrfGuard`), so it must live as long as the refresh cookie:
   * a session-only CSRF cookie next to a 30-day refresh cookie signs the user out on browser close.
   */
  setCsrfToken(res: Response, rememberMe: boolean): void {
    const token = randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: !IS_DEV,
      sameSite: CROSS_ORIGIN ? 'none' : 'lax',
      path: '/',
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
      ...(rememberMe ? { maxAge: THIRTY_DAYS_MS } : {}),
    });
  }

  clearRefreshToken(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, {
      path: REFRESH_COOKIE_PATH,
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    });
  }

  clearCsrfToken(res: Response): void {
    res.clearCookie(CSRF_COOKIE_NAME, {
      path: '/',
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    });
  }
}
