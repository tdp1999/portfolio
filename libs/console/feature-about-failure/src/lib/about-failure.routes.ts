import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const aboutFailureRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./failures-page/failures-page'),
  },
  {
    path: 'new',
    loadComponent: () => import('./failure-form-page/failure-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./failure-form-page/failure-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./failure-detail/failure-detail'),
  },
];
