import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';
import { AuthStore } from '../auth.store';

export const guestGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isBootstrapping()) {
    return authStore.isAuthenticated() ? router.createUrlTree(['/']) : true;
  }

  return toObservable(authStore.isBootstrapping).pipe(
    filter((bootstrapping) => !bootstrapping),
    take(1),
    map(() => (authStore.isAuthenticated() ? router.createUrlTree(['/']) : true))
  );
};
