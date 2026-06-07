import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const projectRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./projects/projects'),
  },
  {
    path: 'new',
    loadComponent: () => import('./project.form/project.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./project.form/project.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./project.detail/project.detail'),
  },
];
