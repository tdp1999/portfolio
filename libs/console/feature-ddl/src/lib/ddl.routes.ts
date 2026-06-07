import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

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
];
