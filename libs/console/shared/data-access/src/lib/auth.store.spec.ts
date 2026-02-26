import { HttpErrorResponse } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UserProfile } from './interfaces';
import { API_CONFIG, ApiConfig } from './api';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  let store: AuthStore;
  let httpTesting: HttpTestingController;

  const config: ApiConfig = {
    baseUrl: 'http://localhost:3000',
    urlPrefix: 'api',
    timeout: 5000,
  };

  const mockUser: UserProfile = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: API_CONFIG, useValue: config },
      ],
    });

    store = TestBed.inject(AuthStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('initial state', () => {
    it('should have null user', () => {
      expect(store.user()).toBeNull();
    });

    it('should not be authenticated', () => {
      expect(store.isAuthenticated()).toBe(false);
    });

    it('should be bootstrapping', () => {
      expect(store.isBootstrapping()).toBe(true);
    });

    it('should have null access token', () => {
      expect(store.getAccessToken()).toBeNull();
    });
  });

  describe('login', () => {
    it('should store access token and fetch user on success', () => {
      let result: UserProfile | undefined;
      store.login('test@example.com', 'password', false).subscribe((user) => (result = user));

      const loginReq = httpTesting.expectOne('http://localhost:3000/api/auth/login');
      expect(loginReq.request.method).toBe('POST');
      expect(loginReq.request.body).toEqual({
        email: 'test@example.com',
        password: 'password',
        rememberMe: false,
      });
      loginReq.flush({ accessToken: 'token-123' });

      const meReq = httpTesting.expectOne('http://localhost:3000/api/auth/me');
      expect(meReq.request.method).toBe('GET');
      meReq.flush(mockUser);

      expect(store.getAccessToken()).toBe('token-123');
      expect(store.user()).toEqual(mockUser);
      expect(store.isAuthenticated()).toBe(true);
      expect(result).toEqual(mockUser);
    });

    it('should pass rememberMe flag', () => {
      store.login('test@example.com', 'password', true).subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/auth/login');
      expect(req.request.body.rememberMe).toBe(true);
      req.flush({ accessToken: 'token' });

      httpTesting.expectOne('http://localhost:3000/api/auth/me').flush(mockUser);
    });

    it('should propagate error on login failure', () => {
      let error: HttpErrorResponse | undefined;
      store.login('test@example.com', 'wrong', false).subscribe({ error: (e) => (error = e) });

      httpTesting
        .expectOne('http://localhost:3000/api/auth/login')
        .flush({ message: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

      expect(error).toBeDefined();
      expect(store.getAccessToken()).toBeNull();
      expect(store.user()).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear state on logout', () => {
      // Set up authenticated state
      store.setAccessToken('token-123');
      store.user.set(mockUser);

      store.logout().subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/auth/logout');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });

      expect(store.getAccessToken()).toBeNull();
      expect(store.user()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
    });
  });

  describe('logoutAll', () => {
    it('should clear state on logout all', () => {
      store.setAccessToken('token-123');
      store.user.set(mockUser);

      store.logoutAll().subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/auth/logout-all');
      expect(req.request.method).toBe('POST');
      req.flush({ success: true });

      expect(store.getAccessToken()).toBeNull();
      expect(store.user()).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('should update access token on success', () => {
      store.refreshToken().subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/auth/refresh');
      expect(req.request.method).toBe('POST');
      req.flush({ accessToken: 'new-token' });

      expect(store.getAccessToken()).toBe('new-token');
    });
  });

  describe('fetchCurrentUser', () => {
    it('should set user signal', () => {
      store.fetchCurrentUser().subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/auth/me');
      req.flush(mockUser);

      expect(store.user()).toEqual(mockUser);
      expect(store.isAuthenticated()).toBe(true);
    });
  });

  describe('bootstrap', () => {
    it('should set user when refresh succeeds', async () => {
      const promise = store.bootstrap();

      const refreshReq = httpTesting.expectOne('http://localhost:3000/api/auth/refresh');
      refreshReq.flush({ accessToken: 'token-from-refresh' });

      const meReq = httpTesting.expectOne('http://localhost:3000/api/auth/me');
      meReq.flush(mockUser);

      await promise;

      expect(store.getAccessToken()).toBe('token-from-refresh');
      expect(store.user()).toEqual(mockUser);
      expect(store.isAuthenticated()).toBe(true);
      expect(store.isBootstrapping()).toBe(false);
    });

    it('should clear state when refresh fails (no session)', async () => {
      const promise = store.bootstrap();

      httpTesting
        .expectOne('http://localhost:3000/api/auth/refresh')
        .flush({ message: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });

      await promise;

      expect(store.getAccessToken()).toBeNull();
      expect(store.user()).toBeNull();
      expect(store.isAuthenticated()).toBe(false);
      expect(store.isBootstrapping()).toBe(false);
    });

    it('should clear state when fetchCurrentUser fails after refresh', async () => {
      const promise = store.bootstrap();

      httpTesting.expectOne('http://localhost:3000/api/auth/refresh').flush({ accessToken: 'tok' });

      httpTesting
        .expectOne('http://localhost:3000/api/auth/me')
        .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      await promise;

      expect(store.user()).toBeNull();
      expect(store.isBootstrapping()).toBe(false);
    });
  });

  describe('setAccessToken', () => {
    it('should store token for interceptors to read', () => {
      store.setAccessToken('manual-token');
      expect(store.getAccessToken()).toBe('manual-token');
    });
  });

  describe('loginWithGoogle', () => {
    it('should build correct Google OAuth URL', () => {
      expect(store.getGoogleLoginUrl()).toBe('http://localhost:3000/api/auth/google');
    });
  });
});
