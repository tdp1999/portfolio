import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const projectRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./projects-page/projects-page'),
  },
  {
    path: 'new',
    loadComponent: () => import('./project-form-page/project-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./project-form-page/project-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./project-detail/project-detail'),
  },
];
