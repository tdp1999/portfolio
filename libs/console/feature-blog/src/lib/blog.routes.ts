import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const blogRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./posts/posts'),
  },
  {
    path: 'new',
    loadComponent: () => import('./post.form/post.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./post.form/post.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./blog-post.detail/blog-post.detail'),
  },
];
