import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('@portfolio/landing/feature-home').then((m) => m.FeatureHome),
    pathMatch: 'full',
  },
  {
    path: 'experience',
    loadComponent: () => import('@portfolio/landing/feature-experience').then((m) => m.FeatureExperience),
  },
  {
    path: 'projects',
    loadChildren: () => import('@portfolio/landing/feature-projects').then((m) => m.PROJECTS_ROUTES),
  },
  {
    path: 'blog',
    loadChildren: () => import('@portfolio/landing/feature-blog').then((m) => m.BLOG_ROUTES),
  },
  {
    path: 'uses',
    loadComponent: () => import('./pages/uses/uses.page').then((m) => m.UsesPage),
  },
  {
    path: 'colophon',
    loadComponent: () => import('./pages/colophon/colophon.page').then((m) => m.ColophonPage),
  },
  {
    path: 'ddl',
    loadComponent: () => import('./pages/ddl').then((m) => m.DdlComponent),
  },
  {
    path: 'sandbox',
    loadComponent: () => import('./pages/sandbox').then((m) => m.SandboxPage),
  },
  {
    path: '404',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
  },
  {
    path: '**',
    redirectTo: '/404',
  },
];
