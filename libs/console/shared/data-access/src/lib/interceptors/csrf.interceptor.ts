import { HttpInterceptorFn } from '@angular/common/http';

function getCsrfToken(): string | null {
  const match = document.cookie.split('; ').find((row) => row.startsWith('csrf_token='));
  return match ? match.split('=')[1] : null;
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'POST' && req.url.includes('/auth/refresh')) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      const cloned = req.clone({
        setHeaders: { 'X-CSRF-Token': csrfToken },
      });
      return next(cloned);
    }
  }

  return next(req);
};
