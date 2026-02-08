import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('@portfolio/landing/feature-home').then((m) => m.FeatureHome),
  },
  {
    path: 'ddl',
    loadComponent: () => import('./pages/ddl').then((m) => m.DdlComponent),
  },
];
