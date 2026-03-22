import { Route } from '@angular/router';

export const mediaRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./media-page/media-page'),
  },
  {
    path: 'trash',
    loadComponent: () => import('./media-trash/media-trash'),
  },
];
