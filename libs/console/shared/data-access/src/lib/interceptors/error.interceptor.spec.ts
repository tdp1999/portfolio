import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ErrorHandler, ERROR_HANDLER } from './error-handler';
import { errorInterceptor, SKIP_ERROR_HANDLING } from './error.interceptor';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpTesting: HttpTestingController;
  let errorHandler: { handleHttpError: jest.Mock };

  beforeEach(() => {
    errorHandler = { handleHttpError: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: ERROR_HANDLER, useValue: errorHandler },
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
    expect(errorHandler.handleHttpError).not.toHaveBeenCalled();
  });

  it('should delegate errors to ERROR_HANDLER', () => {
    http.get('/api/data').subscribe({ error: () => {} });

    httpTesting
      .expectOne('/api/data')
      .flush(
        { name: 'DomainError', message: 'Email is invalid' },
        { status: 400, statusText: 'Bad Request' }
      );

    expect(errorHandler.handleHttpError).toHaveBeenCalledTimes(1);
    expect(errorHandler.handleHttpError.mock.calls[0][0].status).toBe(400);
  });

  it('should re-throw the error after handling', () => {
    const errorSpy = jest.fn();
    http.get('/api/data').subscribe({ error: errorSpy });

    httpTesting.expectOne('/api/data').flush('fail', { status: 500, statusText: 'Error' });

    expect(errorSpy).toHaveBeenCalled();
    expect(errorSpy.mock.calls[0][0].status).toBe(500);
  });

  it('should skip error handling when SKIP_ERROR_HANDLING is set', () => {
    http
      .get('/api/data', { context: new HttpContext().set(SKIP_ERROR_HANDLING, true) })
      .subscribe({ error: () => {} });

    httpTesting.expectOne('/api/data').flush('fail', { status: 400, statusText: 'Bad Request' });

    expect(errorHandler.handleHttpError).not.toHaveBeenCalled();
  });

  it('should work without ERROR_HANDLER provided', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    const httpNoHandler = TestBed.inject(HttpClient);
    const httpTestingNoHandler = TestBed.inject(HttpTestingController);
    const errorSpy = jest.fn();

    httpNoHandler.get('/api/data').subscribe({ error: errorSpy });

    httpTestingNoHandler.expectOne('/api/data').flush('fail', { status: 500, statusText: 'Error' });

    expect(errorSpy).toHaveBeenCalled();
    httpTestingNoHandler.verify();
  });
});
