import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { LandingAuthService } from './landing-auth.service';
import { signInErrorOf } from './landing-auth.util';

const UNAUTHORIZED = { status: 401, statusText: 'Unauthorized' };

describe('LandingAuthService', () => {
  let backend: HttpTestingController;
  let auth: LandingAuthService;

  const setup = (cookie: string, platform = 'browser') => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: PLATFORM_ID, useValue: platform }],
    });
    const document = TestBed.inject(DOCUMENT);
    document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    if (cookie) document.cookie = cookie;
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(LandingAuthService);
  };

  const signIn = () => {
    auth.signIn({ email: 'owner@example.com', password: 'pw' });
    backend.expectOne('/api/auth/login').flush({ accessToken: 'old' });
  };

  afterEach(() => backend.verify());

  describe('restore()', () => {
    it('should sign out without a request when there is no csrf cookie', async () => {
      setup('');

      await auth.restore();

      expect(auth.status()).toBe('signed-out');
    });

    it('should restore the session from the refresh cookie', async () => {
      setup('csrf_token=csrf-1');

      const done = auth.restore();
      backend.expectOne('/api/auth/refresh').flush({ accessToken: 'restored' });
      await done;

      expect(auth.status()).toBe('signed-in');
      expect(auth.token).toBe('restored');
    });

    it('should stay checking on the server, where no session can be read', async () => {
      setup('csrf_token=csrf-1', 'server');

      await auth.restore();

      expect(auth.status()).toBe('checking');
    });
  });

  describe('signOut()', () => {
    it('should log out with the live token and end the session', () => {
      setup('csrf_token=csrf-1');
      signIn();

      auth.signOut();
      const logout = backend.expectOne('/api/auth/logout');
      expect(logout.request.headers.get('Authorization')).toBe('Bearer old');
      logout.flush({ success: true });

      expect(auth.status()).toBe('signed-out');
      expect(auth.token).toBeNull();
    });

    it('should refresh an expired token and log out again, so the API clears the cookies', () => {
      setup('csrf_token=csrf-1');
      signIn();

      auth.signOut();
      backend.expectOne('/api/auth/logout').flush(null, UNAUTHORIZED);
      backend.expectOne('/api/auth/refresh').flush({ accessToken: 'new' });
      const retry = backend.expectOne('/api/auth/logout');
      expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
      retry.flush({ success: true });

      expect(auth.status()).toBe('signed-out');
    });

    it('should end the session locally when the refresh is rejected too', () => {
      setup('csrf_token=csrf-1');
      signIn();

      auth.signOut();
      backend.expectOne('/api/auth/logout').flush(null, UNAUTHORIZED);
      backend.expectOne('/api/auth/refresh').flush(null, UNAUTHORIZED);

      expect(auth.status()).toBe('signed-out');
    });
  });
});

describe('signInErrorOf', () => {
  const httpError = (status: number) => new HttpErrorResponse({ status });

  it.each([
    [httpError(0), 'network'],
    [httpError(429), 'throttled'],
    [httpError(400), 'invalid'],
    [httpError(401), 'invalid'],
    [httpError(500), 'unknown'],
    [new Error('boom'), 'unknown'],
  ])('should sort %p into %s', (error, reason) => {
    expect(signInErrorOf(error)).toBe(reason);
  });
});
