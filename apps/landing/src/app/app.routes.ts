import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('@portfolio/landing/feature-home').then((m) => m.FeatureHome),
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
    path: 'ddl',
    loadComponent: () => import('./pages/ddl').then((m) => m.DdlComponent),
  },
];
