import { Route } from '@angular/router';

export const tagRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./tags-page/tags-page'),
  },
];
