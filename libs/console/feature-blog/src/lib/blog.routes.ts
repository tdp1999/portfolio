import { Route } from '@angular/router';

export const blogRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./posts-page/posts-page'),
  },
  {
    path: 'new',
    loadComponent: () => import('./post-editor-page/post-editor-page'),
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./post-editor-page/post-editor-page'),
  },
];
