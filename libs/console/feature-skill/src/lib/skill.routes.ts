import { Route } from '@angular/router';

export const skillRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./skills-page/skills-page'),
  },
];
