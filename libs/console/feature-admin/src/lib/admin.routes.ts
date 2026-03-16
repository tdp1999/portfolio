import { Route } from '@angular/router';

export const adminRoutes: Route[] = [
  {
    path: 'users',
    loadComponent: () => import('./users-page/users-page'),
  },
  { path: '', redirectTo: 'users', pathMatch: 'full' },
];
