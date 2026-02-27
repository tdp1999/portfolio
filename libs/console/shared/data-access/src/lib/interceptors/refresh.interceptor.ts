import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, EMPTY, filter, switchMap, take, throwError } from 'rxjs';
import { AuthStore } from '../auth.store';

// Client-only: console app uses CSR, no SSR state leakage risk
let isRefreshing = false;
const refreshSubject$ = new BehaviorSubject<string | null>(null);

export function resetRefreshState(): void {
  isRefreshing = false;
  refreshSubject$.next(null);
}

export const refreshInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || req.url.includes('/auth/')) {
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshSubject$.next(null);

        return authStore.refreshToken().pipe(
          switchMap((res) => {
            isRefreshing = false;
            refreshSubject$.next(res.accessToken);

            const cloned = req.clone({
              setHeaders: { Authorization: `Bearer ${res.accessToken}` },
            });
            return next(cloned);
          }),
          catchError((refreshError) => {
            isRefreshing = false;
            refreshSubject$.next(null);
            authStore
              .logout()
              .pipe(catchError(() => EMPTY))
              .subscribe();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }

      return refreshSubject$.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => {
          const cloned = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          });
          return next(cloned);
        })
      );
    })
  );
};
