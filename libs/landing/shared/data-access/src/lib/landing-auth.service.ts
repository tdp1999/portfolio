import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import type { LandingAuthStatus, LandingCredentials, LandingSignInError } from '@portfolio/landing/shared/util';

import { AUTH_LOGIN_URL, AUTH_LOGOUT_URL, AUTH_REFRESH_URL, CSRF_COOKIE, CSRF_HEADER } from './landing-auth.constants';
import { isUnauthorized, signInErrorOf } from './landing-auth.util';

/**
 * The Owner's session on landing, using the console account. App-wide state: the header hides
 * "Sign in" from it, and every private page reads it (the gate, and the session bar that holds
 * sign-out), so signing in once covers the whole site.
 *
 * The access token lives in memory only. A reload gets a new one from the httpOnly refresh cookie
 * (sent by the browser to `/api/auth/refresh`) plus the CSRF header read from the `csrf_token`
 * cookie. Prod scopes both cookies to `.thunderphong.com`, so this session is the console's session:
 * signing in or out on either side does it on both. A visitor without that cookie costs no request.
 *
 * Only the private route group's HttpClient attaches the token (`provideLandingAuthHttp`).
 */
@Injectable({ providedIn: 'root' })
export class LandingAuthService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly status = signal<LandingAuthStatus>('checking');
  readonly isSubmitting = signal(false);
  readonly signInError = signal<LandingSignInError | null>(null);

  private accessToken: string | null = null;
  private refreshing$: Observable<string> | null = null;

  get token(): string | null {
    return this.accessToken;
  }

  /**
   * Once per page load (the app calls it after the first render): a `csrf_token` cookie means a
   * session may exist, so try one silent refresh. On the server there is no session to read, so the
   * status stays `checking` until the browser runs this.
   */
  async restore(): Promise<void> {
    if (!this.isBrowser) return;
    if (!this.readCsrfToken()) {
      this.status.set('signed-out');
      return;
    }
    await firstValueFrom(this.refresh().pipe(catchError(() => of(null))));
  }

  signIn({ email, password }: LandingCredentials): void {
    this.isSubmitting.set(true);
    this.signInError.set(null);
    this.http
      .post<{ accessToken: string }>(AUTH_LOGIN_URL, { email, password, rememberMe: true })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (res) => this.start(res.accessToken),
        error: (error: unknown) => this.signInError.set(signInErrorOf(error)),
      });
  }

  /**
   * New access token from the refresh cookie. Concurrent callers share one request: the API rotates
   * the refresh token, so two parallel refreshes would race. A failure ends the session.
   */
  refresh(): Observable<string> {
    this.refreshing$ ??= this.http
      .post<{ accessToken: string }>(AUTH_REFRESH_URL, {}, { headers: this.csrfHeaders() })
      .pipe(
        map((res) => {
          this.start(res.accessToken);
          return res.accessToken;
        }),
        tap({ error: () => this.end() }),
        finalize(() => (this.refreshing$ = null)),
        shareReplay(1)
      );
    return this.refreshing$;
  }

  /**
   * Logout needs a live access token (the API revokes the refresh token and clears both cookies), so
   * an expired one is refreshed first and the logout sent once more. Without that retry the cookies
   * would survive and the next page load would restore the session. Ends the session locally even
   * when the API call fails: the page must never stay signed in by mistake.
   */
  signOut(): void {
    this.logout(this.accessToken)
      .pipe(
        catchError((error: unknown) =>
          isUnauthorized(error)
            ? this.refresh().pipe(switchMap((token) => this.logout(token)))
            : throwError(() => error)
        ),
        catchError(() => of(null))
      )
      .subscribe(() => this.end());
  }

  private logout(token: string | null): Observable<unknown> {
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
    return this.http.post(AUTH_LOGOUT_URL, {}, { headers });
  }

  private start(token: string): void {
    this.accessToken = token;
    this.signInError.set(null);
    this.status.set('signed-in');
  }

  private end(): void {
    this.accessToken = null;
    this.status.set('signed-out');
  }

  private csrfHeaders(): HttpHeaders {
    const token = this.readCsrfToken();
    return token ? new HttpHeaders({ [CSRF_HEADER]: token }) : new HttpHeaders();
  }

  private readCsrfToken(): string | null {
    const row = this.document.cookie.split('; ').find((r) => r.startsWith(`${CSRF_COOKIE}=`));
    return row ? decodeURIComponent(row.slice(CSRF_COOKIE.length + 1)) : null;
  }
}
