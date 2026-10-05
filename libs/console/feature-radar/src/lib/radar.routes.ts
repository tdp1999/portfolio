import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/ui';

export const radarRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./radar-item.list/radar-item.list'),
  },
  {
    path: 'profile',
    loadComponent: () => import('./radar-profile.form/radar-profile.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'items/:id',
    loadComponent: () => import('./radar-item.detail/radar-item.detail'),
  },
];
