import { HttpErrorResponse } from '@angular/common/http';

export interface ApiError {
  statusCode: number;
  errorCode: string | null;
  message: string;
  data?: unknown;
}

export function extractApiError(err: HttpErrorResponse): ApiError {
  const body = err.error;
  const isObject = body && typeof body === 'object';

  return {
    statusCode: err.status,
    errorCode: isObject && typeof body.errorCode === 'string' ? body.errorCode : null,
    message: isObject && typeof body.message === 'string' ? body.message : 'An unexpected error occurred',
    data: isObject ? body.data : undefined,
  };
}
