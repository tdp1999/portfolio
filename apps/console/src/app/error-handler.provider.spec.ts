import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ERROR_HANDLER, ErrorHandler } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';
import { provideErrorHandler } from './error-handler.provider';

describe('ConsoleErrorHandler', () => {
  let handler: ErrorHandler;
  let router: { navigate: jest.Mock };
  let toastService: { error: jest.Mock };

  beforeEach(() => {
    router = { navigate: jest.fn() };
    toastService = { error: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideErrorHandler(),
        { provide: Router, useValue: router },
        { provide: ToastService, useValue: toastService },
      ],
    });

    handler = TestBed.inject(ERROR_HANDLER);
  });

  it('should skip 401 errors', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 401 }));

    expect(toastService.error).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show network error toast for status 0', () => {
    handler.handleHttpError(
      new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') })
    );

    expect(toastService.error).toHaveBeenCalledWith('Network error');
  });

  it('should not show toast for aborted requests', () => {
    handler.handleHttpError(
      new HttpErrorResponse({ status: 0, error: new DOMException('Aborted', 'AbortError') })
    );

    expect(toastService.error).not.toHaveBeenCalled();
  });

  it('should navigate to error page for 403', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 403 }));

    expect(router.navigate).toHaveBeenCalledWith(['/error', 403], { skipLocationChange: true });
    expect(toastService.error).not.toHaveBeenCalled();
  });

  it('should show toast for 404', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 404 }));

    expect(toastService.error).toHaveBeenCalledWith('The requested resource was not found');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should navigate to error page for 500', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 500 }));

    expect(router.navigate).toHaveBeenCalledWith(['/error', 500], { skipLocationChange: true });
  });

  it('should show rate-limit toast for 429', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 429 }));

    expect(toastService.error).toHaveBeenCalledWith(
      'Too many requests. Please wait a moment and try again.'
    );
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show toast with DomainError message for non-blocking errors', () => {
    handler.handleHttpError(
      new HttpErrorResponse({
        status: 400,
        error: { name: 'DomainError', message: 'Email is invalid' },
      })
    );

    expect(toastService.error).toHaveBeenCalledWith('Email is invalid');
  });

  it('should show generic message when body has no message field', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 422, error: 'plain text' }));

    expect(toastService.error).toHaveBeenCalledWith('An unexpected error occurred');
  });

  it('should show generic message when message is an object (not a string)', () => {
    handler.handleHttpError(
      new HttpErrorResponse({
        status: 400,
        error: { message: { remainingAttempts: 3, retryAfterSeconds: 0 } },
      })
    );

    expect(toastService.error).toHaveBeenCalledWith('An unexpected error occurred');
  });
});
