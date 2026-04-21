import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const experienceRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./experiences-page/experiences-page'),
  },
  {
    path: 'new',
    loadComponent: () => import('./experience-form-page/experience-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./experience-form-page/experience-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./experience-detail/experience-detail'),
  },
];
