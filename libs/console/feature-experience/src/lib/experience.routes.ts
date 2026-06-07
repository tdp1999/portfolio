import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const experienceRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./experiences/experiences'),
  },
  {
    path: 'new',
    loadComponent: () => import('./experience.form/experience.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./experience.form/experience.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./experience.detail/experience.detail'),
  },
];
