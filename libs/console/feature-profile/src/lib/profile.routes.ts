import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/util';

export const profileRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./profile/profile'),
    canDeactivate: [unsavedChangesGuard],
  },
];
