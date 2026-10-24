import type { Response } from 'express';

import { AuthCookieService } from './auth-cookie.service';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const fakeResponse = () => {
  const cookie = jest.fn();
  return { res: { cookie } as unknown as Response, cookie };
};

const optionsOf = (cookie: jest.Mock, name: string) => cookie.mock.calls.find(([n]) => n === name)?.[2];

describe('AuthCookieService', () => {
  const service = new AuthCookieService();

  it('should keep the CSRF cookie as long as a remembered refresh cookie, since refresh needs both', () => {
    const { res, cookie } = fakeResponse();

    service.setRefreshToken(res, 'refresh', true);
    service.setCsrfToken(res, true);

    expect(optionsOf(cookie, 'refresh_token').maxAge).toBe(THIRTY_DAYS_MS);
    expect(optionsOf(cookie, 'csrf_token').maxAge).toBe(THIRTY_DAYS_MS);
  });

  it('should make both cookies end with the browser session when the user is not remembered', () => {
    const { res, cookie } = fakeResponse();

    service.setRefreshToken(res, 'refresh', false);
    service.setCsrfToken(res, false);

    expect(optionsOf(cookie, 'refresh_token')).not.toHaveProperty('maxAge');
    expect(optionsOf(cookie, 'csrf_token')).not.toHaveProperty('maxAge');
  });
});
