import { Route } from '@angular/router';
import { adminGuard, authGuard } from '@portfolio/console/shared/data-access';
import { LayoutShellComponent } from './layout-shell';
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
    loadComponent: () => import('@portfolio/console/feature-error').then((m) => m.ErrorPageComponent),
  },

  // Main routes — sidebar layout
  {
    path: '',
    component: LayoutShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('@portfolio/console/feature-home').then((m) => m.HomeComponent),
      },
      {
        path: 'settings',
        loadChildren: () => import('@portfolio/console/feature-settings').then((m) => m.settingsRoutes),
      },
      {
        path: '',
        canActivate: [adminGuard],
        children: [
          {
            path: 'profile',
            loadChildren: () => import('@portfolio/console/feature-profile').then((m) => m.profileRoutes),
          },
          {
            path: 'admin',
            loadChildren: () => import('@portfolio/console/feature-admin').then((m) => m.adminRoutes),
          },
          {
            path: 'tags',
            loadChildren: () => import('@portfolio/console/feature-tag').then((m) => m.tagRoutes),
          },
          {
            path: 'categories',
            loadChildren: () => import('@portfolio/console/feature-category').then((m) => m.categoryRoutes),
          },
          {
            path: 'skills',
            loadChildren: () => import('@portfolio/console/feature-skill').then((m) => m.skillRoutes),
          },
          {
            path: 'experiences',
            loadChildren: () => import('@portfolio/console/feature-experience').then((m) => m.experienceRoutes),
          },
          {
            path: 'messages',
            loadChildren: () => import('@portfolio/console/feature-messages').then((m) => m.messageRoutes),
          },
          {
            path: 'projects',
            loadChildren: () => import('@portfolio/console/feature-project').then((m) => m.projectRoutes),
          },
          {
            path: 'admin/blog',
            loadChildren: () => import('@portfolio/console/feature-blog').then((m) => m.blogRoutes),
          },
          {
            path: 'media',
            loadChildren: () => import('@portfolio/console/feature-media').then((m) => m.mediaRoutes),
          },
        ],
      },
      ...(environment.production
        ? []
        : [
            {
              path: 'ddl',
              loadChildren: () => import('@portfolio/console/feature-ddl').then((m) => m.ddlRoutes),
            },
          ]),
    ],
  },

  // Wildcard
  { path: '**', redirectTo: '' },
];
