import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const skillRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./skills-page/skills-page'),
  },
  {
    path: 'new',
    loadComponent: () => import('./skill-form-page/skill-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./skill-form-page/skill-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./skill-detail/skill-detail'),
  },
];
