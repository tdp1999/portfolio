import { Route } from '@angular/router';

/**
 * Mounted inside the app's private route group, which supplies the sign-in gate, the session and the
 * token-carrying HttpClient. Nothing auth-related lives in this feature.
 */
export const CHECKLIST_ROUTES: Route[] = [
  { path: '', loadComponent: () => import('./checklist-run.list/checklist-run.list') },
];
