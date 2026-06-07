import { Route } from '@angular/router';

export const mediaRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./media/media'),
  },
  {
    path: 'trash',
    loadComponent: () => import('./media.trash/media.trash'),
  },
];
