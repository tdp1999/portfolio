import { Route } from '@angular/router';

export const categoryRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./categories-page/categories-page'),
  },
];
