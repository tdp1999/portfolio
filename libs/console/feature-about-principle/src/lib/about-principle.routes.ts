import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const aboutPrincipleRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./principles-page/principles-page'),
  },
  {
    path: 'new',
    loadComponent: () => import('./principle-form-page/principle-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./principle-form-page/principle-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./principle-detail/principle-detail'),
  },
];
