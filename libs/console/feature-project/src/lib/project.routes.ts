import { Route } from '@angular/router';

export const projectRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./projects-page/projects-page'),
  },
];
