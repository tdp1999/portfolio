import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'ddl',
    loadComponent: () => import('./pages/ddl').then((m) => m.DdlComponent),
  },
];
