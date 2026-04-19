import { Route } from '@angular/router';
import { adminGuard, authGuard } from '@portfolio/console/shared/data-access';
import { LayoutShellComponent } from './layout-shell';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';
import { environment } from '../environments/environment';

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
    component: LayoutShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/home/home') },
      {
        path: 'profile',
        loadChildren: () => import('@portfolio/console/feature-profile').then((m) => m.profileRoutes),
        canActivate: [adminGuard],
      },
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
        path: 'experiences',
        loadChildren: () => import('@portfolio/console/feature-experience').then((m) => m.experienceRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'messages',
        loadChildren: () => import('@portfolio/console/feature-messages').then((m) => m.messageRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'projects',
        loadChildren: () => import('@portfolio/console/feature-project').then((m) => m.projectRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'admin/blog',
        loadChildren: () => import('@portfolio/console/feature-blog').then((m) => m.blogRoutes),
        canActivate: [adminGuard],
      },
      {
        path: 'media',
        loadChildren: () => import('@portfolio/console/feature-media').then((m) => m.mediaRoutes),
        canActivate: [adminGuard],
      },
      ...(environment.production
        ? []
        : [
            { path: 'ddl', loadComponent: () => import('./pages/ddl/ddl') },
            {
              path: 'ddl/long-form',
              loadComponent: () => import('./pages/ddl/long-form/long-form'),
              canDeactivate: [unsavedChangesGuard],
            },
          ]),
    ],
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
