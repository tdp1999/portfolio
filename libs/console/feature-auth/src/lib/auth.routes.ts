import { Route } from '@angular/router';
import { guestGuard } from '@portfolio/console/shared/data-access';
import { ConsoleBlankLayoutComponent } from '@portfolio/console/shared/ui';

export const authRoutes: Route[] = [
  // OAuth callback — no guard (transitions from guest to authenticated)
  {
    path: 'callback',
    component: ConsoleBlankLayoutComponent,
    children: [{ path: '', loadComponent: () => import('./callback/callback') }],
  },

  // Auth routes — blank layout (no sidebar)
  {
    path: '',
    component: ConsoleBlankLayoutComponent,
    canActivate: [guestGuard],
    children: [
      { path: 'login', loadComponent: () => import('./login/login') },
      {
        path: 'forgot-password',
        loadComponent: () => import('./forgot-password/forgot-password'),
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./reset-password/reset-password'),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
];
