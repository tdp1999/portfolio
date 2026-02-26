import { HttpContextToken, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorHandler, ERROR_HANDLER } from './error-handler';

export const SKIP_ERROR_HANDLING = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_ERROR_HANDLING)) {
    return next(req);
  }

  const errorHandler = inject(ERROR_HANDLER, { optional: true });

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (errorHandler) {
        errorHandler.handleHttpError(error);
      }
      return throwError(() => error);
    })
  );
};
