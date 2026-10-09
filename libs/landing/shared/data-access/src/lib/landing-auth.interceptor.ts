import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, of, switchMap, throwError } from 'rxjs';

import { API_PREFIX, AUTH_API_PREFIX } from './landing-auth.constants';
import { LandingAuthService } from './landing-auth.service';
import { isUnauthorized } from './landing-auth.util';

const withToken = (req: HttpRequest<unknown>, token: string | null) =>
  token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

const needsToken = (url: string) => url.startsWith(API_PREFIX) && !url.startsWith(AUTH_API_PREFIX);

/**
 * Attaches the access token to API requests made from the private route group (only that group's
 * HttpClient runs this interceptor, so public pages never send it). On a 401 it refreshes once and
 * retries; if the refresh fails, the session has already ended and the gate shows the sign-in form.
 * A request that went out with a token another refresh has since replaced just retries with the new
 * one: refreshing again would rotate the refresh token for nothing.
 */
export const landingAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!needsToken(req.url)) return next(req);
  const auth = inject(LandingAuthService);
  const sent = auth.token;

  return next(withToken(req, sent)).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error)) return throwError(() => error);
      const current = auth.token;
      const token$ = current && current !== sent ? of(current) : auth.refresh();
      return token$.pipe(switchMap((token) => next(withToken(req, token))));
    })
  );
};
