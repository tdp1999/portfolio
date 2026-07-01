import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/ui';

export const aboutPrincipleRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./principles/principles'),
  },
  {
    path: 'new',
    loadComponent: () => import('./principle.form/principle.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./principle.form/principle.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./principle.detail/principle.detail'),
  },
];
