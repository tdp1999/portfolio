import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthStore } from '../auth.store';
import { refreshInterceptor, resetRefreshState } from './refresh.interceptor';

describe('refreshInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let authStore: { refreshToken: jest.Mock; logout: jest.Mock };
  let router: { navigate: jest.Mock };

  beforeEach(() => {
    resetRefreshState();

    authStore = {
      refreshToken: jest.fn(),
      logout: jest.fn(() => of(void 0)),
    };
    router = { navigate: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([refreshInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthStore, useValue: authStore },
        { provide: Router, useValue: router },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('should pass through successful responses', () => {
    http.get('/api/data').subscribe((res) => {
      expect(res).toEqual({ ok: true });
    });

    httpTesting.expectOne('/api/data').flush({ ok: true });
  });

  it('should pass through non-401 errors', () => {
    http.get('/api/data').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(500);
      },
    });

    httpTesting.expectOne('/api/data').flush('Server error', { status: 500, statusText: 'Error' });
  });

  it('should refresh token and retry on 401', () => {
    authStore.refreshToken.mockReturnValue(of({ accessToken: 'new-token' }));

    http.get('/api/data').subscribe((res) => {
      expect(res).toEqual({ ok: true });
    });

    // First request returns 401
    httpTesting
      .expectOne('/api/data')
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    // Retry with new token
    const retryReq = httpTesting.expectOne('/api/data');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-token');
    retryReq.flush({ ok: true });
  });

  it('should redirect to login when refresh fails', () => {
    authStore.refreshToken.mockReturnValue(throwError(() => new Error('Refresh failed')));

    http.get('/api/data').subscribe({
      error: (err: Error) => {
        expect(err).toBeDefined();
      },
    });

    httpTesting
      .expectOne('/api/data')
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(router.navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('should not attempt refresh for 401 on /auth/refresh endpoint', () => {
    http.get('/api/auth/refresh').subscribe({
      error: (err: HttpErrorResponse) => {
        expect(err.status).toBe(401);
      },
    });

    httpTesting
      .expectOne('/api/auth/refresh')
      .flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });

    expect(authStore.refreshToken).not.toHaveBeenCalled();
  });

  it('should queue concurrent requests during refresh', () => {
    authStore.refreshToken.mockReturnValue(of({ accessToken: 'new-token' }));

    const results: unknown[] = [];

    http.get('/api/data1').subscribe((res) => results.push(res));
    http.get('/api/data2').subscribe((res) => results.push(res));

    // Both return 401
    httpTesting.expectOne('/api/data1').flush('', { status: 401, statusText: 'Unauthorized' });
    httpTesting.expectOne('/api/data2').flush('', { status: 401, statusText: 'Unauthorized' });

    // Both should retry
    const retries = httpTesting.match(
      (req) => req.url === '/api/data1' || req.url === '/api/data2'
    );
    expect(retries.length).toBe(2);
    retries.forEach((r) => {
      expect(r.request.headers.get('Authorization')).toBe('Bearer new-token');
      r.flush({ ok: true });
    });

    expect(results).toHaveLength(2);
  });
});
