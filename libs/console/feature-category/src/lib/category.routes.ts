import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const categoryRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./categories-page/categories-page'),
  },
  {
    path: 'new',
    loadComponent: () => import('./category-form-page/category-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./category-form-page/category-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./category-detail/category-detail'),
  },
];
