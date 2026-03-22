import { Route } from '@angular/router';
import { adminGuard, authGuard } from '@portfolio/console/shared/data-access';
import { ConsoleMainLayoutComponent } from '@portfolio/console/shared/ui';

export const appRoutes: Route[] = [
  // Auth routes — delegated to feature-auth library
  {
    path: 'auth',
    loadChildren: () => import('@portfolio/console/feature-auth').then((m) => m.authRoutes),
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
      {
        path: 'settings',
        loadChildren: () => import('@portfolio/console/feature-settings').then((m) => m.settingsRoutes),
      },
      {
        path: 'admin',
        loadChildren: () => import('@portfolio/console/feature-admin').then((m) => m.adminRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'tags',
        loadChildren: () => import('@portfolio/console/feature-tag').then((m) => m.tagRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'categories',
        loadChildren: () => import('@portfolio/console/feature-category').then((m) => m.categoryRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'skills',
        loadChildren: () => import('@portfolio/console/feature-skill').then((m) => m.skillRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'media',
        loadChildren: () => import('@portfolio/console/feature-media').then((m) => m.mediaRoutes),
        canActivate: [adminGuard],
      },
      { path: 'ddl', loadComponent: () => import('./pages/ddl/ddl') },
    ],
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
