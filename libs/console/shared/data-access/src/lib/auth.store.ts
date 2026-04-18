import { HttpContext } from '@angular/common/http';
import { computed, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, EMPTY, switchMap, tap } from 'rxjs';
import { API_CONFIG, ApiService } from './api';
import { SKIP_ERROR_HANDLING } from './interceptors/error.interceptor';
import { LoginResponse, UserProfile } from '@portfolio/console/shared/util';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly api = inject(ApiService);
  private readonly apiConfig = inject(API_CONFIG);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private accessToken: string | null = null;

  readonly user = signal<UserProfile | null>(null);
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly isBootstrapping = signal(true);

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  login(email: string, password: string, rememberMe: boolean) {
    return this.api.post<LoginResponse>('/auth/login', { email, password, rememberMe }).pipe(
      tap((res) => {
        this.accessToken = res.accessToken;
      }),
      switchMap(() => this.fetchCurrentUser())
    );
  }

  getGoogleLoginUrl(): string {
    const prefix = this.buildUrlPrefix();
    return `${this.apiConfig.baseUrl}/${prefix}/auth/google`;
  }

  loginWithGoogle(): void {
    window.location.href = this.getGoogleLoginUrl();
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.api.post('/auth/change-password', { currentPassword, newPassword });
  }

  logout() {
    return this.api.post('/auth/logout', {}).pipe(tap(() => this.clearState()));
  }

  logoutAll() {
    return this.api.post('/auth/logout-all', {}).pipe(tap(() => this.clearState()));
  }

  refreshToken(options?: { context?: HttpContext }) {
    return this.api.post<LoginResponse>('/auth/refresh', {}, options).pipe(
      tap((res) => {
        this.accessToken = res.accessToken;
      })
    );
  }

  fetchCurrentUser(options?: { context?: HttpContext }) {
    return this.api.get<UserProfile>('/auth/me', options).pipe(tap((user) => this.user.set(user)));
  }

  bootstrap(): Promise<void> {
    this.isBootstrapping.set(true);

    if (!this.hasCsrfCookie()) {
      this.clearState();
      this.isBootstrapping.set(false);
      return Promise.resolve();
    }

    const silentContext = { context: new HttpContext().set(SKIP_ERROR_HANDLING, true) };

    return new Promise<void>((resolve) => {
      this.refreshToken(silentContext)
        .pipe(
          switchMap(() => this.fetchCurrentUser(silentContext)),
          catchError(() => {
            this.clearState();
            return EMPTY;
          })
        )
        .subscribe({
          complete: () => {
            this.isBootstrapping.set(false);
            resolve();
          },
        });
    });
  }

  private hasCsrfCookie(): boolean {
    return this.isBrowser && document.cookie.split('; ').some((row) => row.startsWith('csrf_token='));
  }

  private clearState(): void {
    this.accessToken = null;
    this.user.set(null);
  }

  private buildUrlPrefix(): string {
    const prefixes = Array.isArray(this.apiConfig.urlPrefix) ? this.apiConfig.urlPrefix : [this.apiConfig.urlPrefix];
    return prefixes.filter(Boolean).join('/');
  }
}
