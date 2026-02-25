import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import { randomBytes } from 'crypto';

const REFRESH_COOKIE_NAME = 'refresh_token';
const REFRESH_COOKIE_PATH = '/api/auth/refresh';
const CSRF_COOKIE_NAME = 'csrf_token';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthCookieService {
  setRefreshToken(res: Response, refreshToken: string, rememberMe: boolean): void {
    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] !== 'development',
      sameSite: 'lax',
      path: REFRESH_COOKIE_PATH,
      ...(rememberMe ? { maxAge: THIRTY_DAYS_MS } : {}),
    });
  }

  setCsrfToken(res: Response): void {
    const token = randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: false,
      secure: process.env['NODE_ENV'] !== 'development',
      sameSite: 'lax',
      path: '/',
    });
  }

  clearRefreshToken(res: Response): void {
    res.clearCookie(REFRESH_COOKIE_NAME, { path: REFRESH_COOKIE_PATH });
  }

  clearCsrfToken(res: Response): void {
    res.clearCookie(CSRF_COOKIE_NAME, { path: '/' });
  }
}
