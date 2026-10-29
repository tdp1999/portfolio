import { Route } from '@angular/router';
import { unsavedChangesGuard } from '@portfolio/console/shared/ui';

export const medicineCabinetRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./medical-item.list/medical-item.list'),
  },
  {
    path: 'new',
    loadComponent: () => import('./medical-item.form/medical-item.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./medical-item.form/medical-item.form'),
    canDeactivate: [unsavedChangesGuard],
  },
  {
    path: 'people',
    loadComponent: () => import('./health-profile.list/health-profile.list'),
  },
];
