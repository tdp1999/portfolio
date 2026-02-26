import { Route } from '@angular/router';
import { authGuard, guestGuard } from '@portfolio/console/shared/data-access';
import {
  ConsoleBlankLayoutComponent,
  ConsoleMainLayoutComponent,
} from '@portfolio/console/shared/ui';

export const appRoutes: Route[] = [
  // OAuth callback — no guard (transitions from guest to authenticated)
  {
    path: 'auth/callback',
    component: ConsoleBlankLayoutComponent,
    children: [{ path: '', loadComponent: () => import('./pages/auth/callback/callback') }],
  },

  // Auth routes — blank layout (no sidebar)
  {
    path: 'auth',
    component: ConsoleBlankLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./pages/auth/login/login') },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/auth/forgot-password/forgot-password'),
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./pages/auth/reset-password/reset-password'),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Error pages — no layout wrapper
  {
    path: 'error/:code',
    loadComponent: () => import('./pages/error/error-page'),
  },

  // Main routes — sidebar layout
  {
    path: '',
    component: ConsoleMainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/home/home') },
      { path: 'ddl', loadComponent: () => import('./pages/ddl/ddl') },
    ],
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
