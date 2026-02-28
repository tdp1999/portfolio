import { HttpErrorResponse } from '@angular/common/http';
import { inject, Provider } from '@angular/core';
import { Router } from '@angular/router';
import {
  ERROR_HANDLER,
  ErrorHandler,
  ValidationErrorService,
  ErrorDataService,
} from '@portfolio/console/shared/data-access';
import { extractApiError, resolveErrorMessage } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';

const BLOCKING_STATUSES = new Set([403, 500]);
const VALIDATION_SUFFIXES = ['_INVALID_INPUT', '_VALIDATION_ERROR'];

function isValidationCode(code: string): boolean {
  return VALIDATION_SUFFIXES.some((suffix) => code.endsWith(suffix));
}

class ConsoleErrorHandler implements ErrorHandler {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private validationErrorService = inject(ValidationErrorService);
  private errorDataService = inject(ErrorDataService);

  handleHttpError(error: HttpErrorResponse): void {
    // 401 — refresh interceptor handles it
    if (error.status === 401) return;

    // Network error
    if (error.status === 0) {
      const isAbort = error.error instanceof DOMException && error.error.name === 'AbortError';
      if (!isAbort) {
        this.toastService.error('Network error');
      }
      return;
    }

    // Rate limit
    if (error.status === 429) {
      this.toastService.error('Too many requests. Please wait a moment and try again.');
      return;
    }

    // Blocking errors — navigate to error page
    if (BLOCKING_STATUSES.has(error.status)) {
      this.router.navigate(['/error', error.status], { skipLocationChange: true });
      return;
    }

    // Extract structured error
    const apiError = extractApiError(error);
    const { errorCode } = apiError;

    // Validation errors — push to ValidationErrorService, no toast
    if (errorCode && isValidationCode(errorCode)) {
      const fieldErrors = apiError.data as Record<string, string[]> | undefined;
      if (fieldErrors && typeof fieldErrors === 'object') {
        this.validationErrorService.push(fieldErrors);
      }
      return;
    }

    // Known error code — toast dictionary message, push data for components
    const dictMessage = resolveErrorMessage(errorCode);
    if (dictMessage) {
      this.toastService.error(dictMessage);
      this.errorDataService.push(apiError);
      return;
    }

    // Unknown/missing error code — do nothing, component handles it
  }
}

export function provideErrorHandler(): Provider {
  return { provide: ERROR_HANDLER, useClass: ConsoleErrorHandler };
}
