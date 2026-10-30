import { Route } from '@angular/router';

import { MedicineCabinetService } from './medicine-cabinet.service';

/**
 * Mounted inside the app's private route group, which supplies the sign-in gate, the session and the
 * token-carrying HttpClient. The service is provided here so it injects that HttpClient (see
 * `MedicineCabinetService`). The app provides `CONSOLE_URL` for the edit links.
 */
export const MEDICINE_CABINET_ROUTES: Route[] = [
  {
    path: '',
    providers: [MedicineCabinetService],
    loadComponent: () => import('./medicine-lookup/medicine-lookup'),
  },
];
