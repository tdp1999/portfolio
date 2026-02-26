import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { csrfInterceptor } from './csrf.interceptor';

describe('csrfInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([csrfInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    Object.defineProperty(document, 'cookie', { value: '', writable: true, configurable: true });
  });

  it('should attach X-CSRF-Token header on POST to /auth/refresh', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'csrf_token=abc123',
      writable: true,
      configurable: true,
    });

    http.post('/api/auth/refresh', {}).subscribe();

    const req = httpTesting.expectOne('/api/auth/refresh');
    expect(req.request.headers.get('X-CSRF-Token')).toBe('abc123');
    req.flush({});
  });

  it('should not attach header when csrf_token cookie is absent', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'other=value',
      writable: true,
      configurable: true,
    });

    http.post('/api/auth/refresh', {}).subscribe();

    const req = httpTesting.expectOne('/api/auth/refresh');
    expect(req.request.headers.has('X-CSRF-Token')).toBe(false);
    req.flush({});
  });

  it('should not attach header on GET requests', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'csrf_token=abc123',
      writable: true,
      configurable: true,
    });

    http.get('/api/auth/refresh').subscribe();

    const req = httpTesting.expectOne('/api/auth/refresh');
    expect(req.request.headers.has('X-CSRF-Token')).toBe(false);
    req.flush({});
  });

  it('should not attach header on POST to non-refresh endpoints', () => {
    Object.defineProperty(document, 'cookie', {
      value: 'csrf_token=abc123',
      writable: true,
      configurable: true,
    });

    http.post('/api/auth/login', {}).subscribe();

    const req = httpTesting.expectOne('/api/auth/login');
    expect(req.request.headers.has('X-CSRF-Token')).toBe(false);
    req.flush({});
  });
});
