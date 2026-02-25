import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG, ApiConfig } from './api.config';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpTesting: HttpTestingController;

  const config: ApiConfig = {
    baseUrl: 'http://localhost:3000',
    urlPrefix: 'api',
    timeout: 5000,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: config },
      ],
    });

    service = TestBed.inject(ApiService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('get', () => {
    it('should make GET request with built URL', () => {
      service.get('users').subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/users');
      expect(req.request.method).toBe('GET');
      expect(req.request.withCredentials).toBe(true);
      req.flush([]);
    });

    it('should pass query params', () => {
      service.get('users', { role: 'admin' }).subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/users?role=admin');
      expect(req.request.params.get('role')).toBe('admin');
      req.flush([]);
    });
  });

  describe('post', () => {
    it('should make POST request with body', () => {
      const body = { name: 'test' };
      service.post('users', body).subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });
  });

  describe('put', () => {
    it('should make PUT request with body', () => {
      const body = { name: 'updated' };
      service.put('users/1', body).subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/users/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({});
    });
  });

  describe('patch', () => {
    it('should make PATCH request with body', () => {
      const body = { name: 'patched' };
      service.patch('users/1', body).subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/users/1');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(body);
      req.flush({});
    });
  });

  describe('delete', () => {
    it('should make DELETE request', () => {
      service.delete('users/1').subscribe();

      const req = httpTesting.expectOne('http://localhost:3000/api/users/1');
      expect(req.request.method).toBe('DELETE');
      expect(req.request.withCredentials).toBe(true);
      req.flush({});
    });
  });

  describe('URL building', () => {
    it('should handle array urlPrefix', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: API_CONFIG,
            useValue: { baseUrl: 'http://localhost:3000', urlPrefix: ['api', 'v2'], timeout: 5000 },
          },
        ],
      });

      const svc = TestBed.inject(ApiService);
      const ctrl = TestBed.inject(HttpTestingController);

      svc.get('users').subscribe();

      const req = ctrl.expectOne('http://localhost:3000/api/v2/users');
      expect(req.request.url).toBe('http://localhost:3000/api/v2/users');
      req.flush([]);
      ctrl.verify();
    });

    it('should handle no urlPrefix', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          {
            provide: API_CONFIG,
            useValue: { baseUrl: 'http://localhost:3000', timeout: 5000 },
          },
        ],
      });

      const svc = TestBed.inject(ApiService);
      const ctrl = TestBed.inject(HttpTestingController);

      svc.get('users').subscribe();

      const req = ctrl.expectOne('http://localhost:3000/users');
      expect(req.request.url).toBe('http://localhost:3000/users');
      req.flush([]);
      ctrl.verify();
    });
  });
});
