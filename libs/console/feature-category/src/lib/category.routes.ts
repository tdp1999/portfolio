import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/ui';

export const categoryRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./categories/categories'),
  },
  {
    path: 'new',
    loadComponent: () => import('./category.form/category.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./category.form/category.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./category.detail/category.detail'),
  },
];
