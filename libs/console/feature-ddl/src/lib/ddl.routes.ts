import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/ui';

export const ddlRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./ddl/ddl'),
  },
  {
    path: 'long-form',
    loadComponent: () => import('./ddl-long.form/ddl-long.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'anatomy-list',
    loadComponent: () => import('./ddl-anatomy-list/ddl-anatomy-list'),
  },
  {
    path: 'anatomy-detail',
    loadComponent: () => import('./ddl-anatomy-detail/ddl-anatomy-detail'),
  },
  {
    path: 'anatomy-form',
    loadComponent: () => import('./ddl-anatomy-form/ddl-anatomy-form'),
  },
];
