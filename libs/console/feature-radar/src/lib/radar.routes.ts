import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/ui';

export const radarRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./radar-item.list/radar-item.list'),
  },
  {
    path: 'runs',
    loadComponent: () => import('./radar-run.list/radar-run.list'),
  },
  {
    path: 'briefs',
    loadComponent: () => import('./radar-brief.list/radar-brief.list'),
  },
  {
    path: 'briefs/:id',
    loadComponent: () => import('./radar-brief.detail/radar-brief.detail'),
  },
  {
    path: 'profile',
    loadComponent: () => import('./radar-profile.form/radar-profile.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'items/:id',
    loadComponent: () => import('./radar-item.detail/radar-item.detail'),
  },
];
