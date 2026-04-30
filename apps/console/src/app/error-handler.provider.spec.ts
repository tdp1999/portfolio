import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ERROR_HANDLER, ErrorHandler } from '@portfolio/console/shared/data-access';
import { ErrorDataService, ValidationErrorService } from '@portfolio/console/shared/util';
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
        { provide: ValidationErrorService, useValue: { push: jest.fn() } },
        { provide: ErrorDataService, useValue: { push: jest.fn() } },
      ],
    });

    handler = TestBed.inject(ERROR_HANDLER);
  });

  it('should skip 401 errors on non-auth endpoints', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 401 }));

    expect(toastService.error).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should show network error toast for status 0', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') }));

    expect(toastService.error).toHaveBeenCalledWith('Network error');
  });

  it('should not show toast for aborted requests', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 0, error: new DOMException('Aborted', 'AbortError') }));

    expect(toastService.error).not.toHaveBeenCalled();
  });

  it('should navigate to error page for 403', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 403 }));

    expect(router.navigate).toHaveBeenCalledWith(['/error', 403], { skipLocationChange: true });
    expect(toastService.error).not.toHaveBeenCalled();
  });

  it('should navigate to error page for 500', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 500 }));

    expect(router.navigate).toHaveBeenCalledWith(['/error', 500], { skipLocationChange: true });
  });

  it('should show rate-limit toast for 429', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 429 }));

    expect(toastService.error).toHaveBeenCalledWith('Too many requests. Please wait a moment and try again.');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // When the BE returns a non-JSON string body, extractApiError wraps it as { message: <string> }
  // and the handler toasts that string verbatim (BE-message fallback path). The hardcoded
  // fallback in the handler only fires when no message can be derived at all — which
  // extractApiError prevents by always producing 'An unexpected error occurred' as a default.
  it('toasts the raw BE string when the body is plain text', () => {
    handler.handleHttpError(new HttpErrorResponse({ status: 422, error: 'plain text' }));

    expect(toastService.error).toHaveBeenCalledWith('plain text');
  });

  // When `message` is an object (not a string), extractApiError discards it and uses its own
  // 'An unexpected error occurred' default. The handler then toasts that default.
  it("toasts the extractor's default when message is an object (not a string)", () => {
    handler.handleHttpError(
      new HttpErrorResponse({
        status: 400,
        error: { message: { remainingAttempts: 3, retryAfterSeconds: 0 } },
      })
    );

    expect(toastService.error).toHaveBeenCalledWith('An unexpected error occurred');
  });
});
