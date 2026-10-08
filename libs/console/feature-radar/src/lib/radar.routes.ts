import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/ui';

export const radarRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./radar-item.list/radar-item.list'),
    // The workflow profile dialog lives on the Feed; leaving with unsaved edits asks first.
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'runs',
    loadComponent: () => import('./radar-run.list/radar-run.list'),
  },
  {
    path: 'runs/:id',
    loadComponent: () => import('./radar-run.detail/radar-run.detail'),
  },
  {
    path: 'briefs',
    loadComponent: () => import('./radar-brief.list/radar-brief.list'),
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
