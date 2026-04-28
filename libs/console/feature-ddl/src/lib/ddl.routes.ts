import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const ddlRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./ddl'),
  },
  {
    path: 'long-form',
    loadComponent: () => import('./long-form/long-form'),
    canDeactivate: [unsavedChangesGuard],
  },
];
