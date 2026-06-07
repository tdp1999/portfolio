import { Route } from '@angular/router';

export const adminRoutes: Route[] = [
  {
    path: 'users',
    loadComponent: () => import('./users/users'),
  },
  { path: '', redirectTo: 'users', pathMatch: 'full' },
];
