import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/ui';

export const skillRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./skills/skills'),
  },
  {
    path: 'reorder',
    loadComponent: () => import('./skill.reorder/skill.reorder'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'new',
    loadComponent: () => import('./skill.form/skill.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./skill.form/skill.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id',
    loadComponent: () => import('./skill.detail/skill.detail'),
  },
];
