import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/ui';

export const radarRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./radar-item.list/radar-item.list'),
    // The workflow profile dialog lives on the Feed; leaving with unsaved edits asks first.
    canDeactivate: [unsavedChangesGuard],
    // Runs and Briefs open over the Feed as routed popups, so their URLs stay shareable. A run's or a
    // brief's own page (`runs/:id`) does not match here and falls through to the full-page routes below.
    children: [
      { path: '', pathMatch: 'full', children: [] },
      { path: 'runs', loadComponent: () => import('./radar-page.dialog/radar-page.dialog'), data: { page: 'runs' } },
      {
        path: 'briefs',
        loadComponent: () => import('./radar-page.dialog/radar-page.dialog'),
        data: { page: 'briefs' },
      },
    ],
  },
  {
    path: 'runs/:id',
    loadComponent: () => import('./radar-run.detail/radar-run.detail'),
  },
  {
    path: 'briefs/:id',
    loadComponent: () => import('./radar-brief.detail/radar-brief.detail'),
  },
  // The workflow profile is a dialog on the Feed now; old bookmarks land there.
  { path: 'profile', redirectTo: '' },
  {
    path: 'items/:id',
    loadComponent: () => import('./radar-item.detail/radar-item.detail'),
  },
];
