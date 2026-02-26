import { HttpErrorResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

export interface ErrorHandler {
  handleHttpError(error: HttpErrorResponse): void;
}

export const ERROR_HANDLER = new InjectionToken<ErrorHandler>('ERROR_HANDLER');
