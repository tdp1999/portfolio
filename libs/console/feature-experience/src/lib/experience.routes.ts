import { Route } from '@angular/router';

export const experienceRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./experiences-page/experiences-page'),
  },
];
