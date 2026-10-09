import { DOCUMENT } from '@angular/common';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { landingAuthInterceptor } from './landing-auth.interceptor';
import { LandingAuthService } from './landing-auth.service';

describe('landingAuthInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: LandingAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptors([landingAuthInterceptor])), provideHttpClientTesting()],
    });
    TestBed.inject(DOCUMENT).cookie = 'csrf_token=csrf-1';
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(LandingAuthService);
  });

  afterEach(() => backend.verify());

  const signIn = () => {
    auth.signIn({ email: 'owner@example.com', password: 'pw' });
    backend.expectOne('/api/auth/login').flush({ accessToken: 'old' });
  };

  it('should attach the token to API requests but not to the auth calls or non-API files', () => {
    signIn();

    http.get('/api/notes').subscribe();
    http.get('/i18n/en.json').subscribe();
    auth.refresh().subscribe();

    expect(backend.expectOne('/api/notes').request.headers.get('Authorization')).toBe('Bearer old');
    expect(backend.expectOne('/i18n/en.json').request.headers.has('Authorization')).toBe(false);
    expect(backend.expectOne('/api/auth/refresh').request.headers.has('Authorization')).toBe(false);
  });

  it('should refresh once with the CSRF header and retry when the token has expired', () => {
    signIn();
    let body: unknown;
    http.get('/api/checklist/runs').subscribe((res) => (body = res));

    backend.expectOne('/api/checklist/runs').flush(null, { status: 401, statusText: 'Unauthorized' });
    const refresh = backend.expectOne('/api/auth/refresh');
    expect(refresh.request.headers.get('x-csrf-token')).toBe('csrf-1');
    refresh.flush({ accessToken: 'new' });
    const retry = backend.expectOne('/api/checklist/runs');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
    retry.flush([]);

    expect(body).toEqual([]);
  });

  it('should share one refresh between two requests that fail together', () => {
    signIn();
    http.get('/api/checklist/runs').subscribe();
    http.get('/api/checklist/docs').subscribe();

    backend.expectOne('/api/checklist/runs').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/checklist/docs').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh').flush({ accessToken: 'new' });

    backend.expectOne('/api/checklist/runs').flush([]);
    backend.expectOne('/api/checklist/docs').flush([]);
  });

  it('should retry with the new token, without a second refresh, when the 401 answers an older token', () => {
    signIn();
    http.get('/api/checklist/runs').subscribe();
    http.get('/api/checklist/docs').subscribe();

    backend.expectOne('/api/checklist/runs').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh').flush({ accessToken: 'new' });
    backend.expectOne('/api/checklist/runs').flush([]);
    backend.expectOne('/api/checklist/docs').flush(null, { status: 401, statusText: 'Unauthorized' });

    const retry = backend.expectOne('/api/checklist/docs');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new');
    retry.flush([]);
  });

  it('should sign out when the refresh is rejected', () => {
    signIn();
    let failed = false;
    http.get('/api/checklist/runs').subscribe({ error: () => (failed = true) });

    backend.expectOne('/api/checklist/runs').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(auth.status()).toBe('signed-out');
  });
});
