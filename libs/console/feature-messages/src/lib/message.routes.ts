import { Route } from '@angular/router';

export const messageRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./messages/messages'),
  },
  {
    path: ':id',
    loadComponent: () => import('./message.detail/message.detail'),
  },
];
