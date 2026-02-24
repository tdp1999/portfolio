import { Route } from '@angular/router';
import {
  ConsoleBlankLayoutComponent,
  ConsoleMainLayoutComponent,
} from '@portfolio/console/shared/ui';

export const appRoutes: Route[] = [
  // Auth routes — blank layout (no sidebar)
  // TODO: Add auth guard to redirect authenticated users
  {
    path: 'auth',
    component: ConsoleBlankLayoutComponent,
    children: [
      { path: 'login', loadComponent: () => import('./pages/auth/login/login') },
      { path: 'signup', loadComponent: () => import('./pages/auth/signup/signup') },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Main routes — sidebar layout
  // TODO: Add auth guard to protect routes
  {
    path: '',
    component: ConsoleMainLayoutComponent,
    children: [{ path: '', loadComponent: () => import('./pages/home/home') }],
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
