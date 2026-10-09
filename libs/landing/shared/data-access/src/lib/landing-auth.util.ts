import { HttpErrorResponse } from '@angular/common/http';

import type { LandingSignInError } from '@portfolio/landing/shared/util';

/** A 401: the access token is missing or expired. */
export function isUnauthorized(error: unknown): boolean {
  return error instanceof HttpErrorResponse && error.status === 401;
}

/** Sorts a failed `POST /api/auth/login` into the reason the form shows. */
export function signInErrorOf(error: unknown): LandingSignInError {
  if (!(error instanceof HttpErrorResponse)) return 'unknown';
  if (error.status === 0) return 'network';
  if (error.status === 429) return 'throttled';
  if (error.status === 400 || error.status === 401) return 'invalid';
  return 'unknown';
}
