import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const blogRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./posts-page/posts-page'),
  },
  {
    path: 'new',
    loadComponent: () => import('./post-form-page/post-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./post-form-page/post-form-page'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./blog-post-detail/blog-post-detail'),
  },
];
