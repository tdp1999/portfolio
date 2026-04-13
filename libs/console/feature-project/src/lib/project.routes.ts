import { Route } from '@angular/router';

export const projectRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./projects-page/projects-page'),
  },
  {
    path: ':id',
    loadComponent: () => import('./project-detail/project-detail'),
  },
];
