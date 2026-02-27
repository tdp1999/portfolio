import { Route } from '@angular/router';

export const settingsRoutes: Route[] = [
  {
    path: 'change-password',
    loadComponent: () => import('./change-password/change-password'),
  },
  { path: '', redirectTo: 'change-password', pathMatch: 'full' },
];
