import { Route } from '@angular/router';

export const aiRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./ai-usage.list/ai-usage.list'),
  },
];
