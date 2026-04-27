import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const tagRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./tags-page/tags-page'),
  },
  {
    path: 'new',
    loadComponent: () => import('./tag-form-page/tag-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./tag-form-page/tag-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./tag-detail/tag-detail'),
  },
];
