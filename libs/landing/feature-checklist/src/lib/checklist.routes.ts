import { Route } from '@angular/router';

import { ChecklistService } from './checklist.service';

/**
 * Mounted inside the app's private route group, which supplies the sign-in gate, the session and the
 * token-carrying HttpClient. Nothing auth-related lives in this feature; the service is provided here
 * so it injects that HttpClient (see `ChecklistService`).
 */
export const CHECKLIST_ROUTES: Route[] = [
  {
    path: '',
    providers: [ChecklistService],
    children: [
      { path: '', loadComponent: () => import('./checklist-run.list/checklist-run.list') },
      { path: ':id', loadComponent: () => import('./checklist-run.detail/checklist-run.detail') },
    ],
  },
];
