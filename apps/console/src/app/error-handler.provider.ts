import { HttpErrorResponse } from '@angular/common/http';
import { inject, Provider } from '@angular/core';
import { Router } from '@angular/router';
import { ERROR_HANDLER, ErrorHandler } from '@portfolio/console/shared/data-access';
import { ToastService } from '@portfolio/console/shared/ui';

const BLOCKING_STATUSES = new Set([403, 500]);

class ConsoleErrorHandler implements ErrorHandler {
  private router = inject(Router);
  private toastService = inject(ToastService);

  handleHttpError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      return;
    }

    if (error.status === 0) {
      const isAbort = error.error instanceof DOMException && error.error.name === 'AbortError';
      if (!isAbort) {
        this.toastService.error('Network error');
      }
      return;
    }

    if (error.status === 404) {
      this.toastService.error('The requested resource was not found');
      return;
    }

    if (BLOCKING_STATUSES.has(error.status)) {
      this.router.navigate(['/error', error.status], { skipLocationChange: true });
      return;
    }

    const message =
      error.error && typeof error.error === 'object' && 'message' in error.error
        ? error.error.message
        : 'An unexpected error occurred';

    this.toastService.error(message);
  }
}

export function provideErrorHandler(): Provider {
  return { provide: ERROR_HANDLER, useClass: ConsoleErrorHandler };
}
