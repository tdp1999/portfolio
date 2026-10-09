import { provideHttpClient, withInterceptors, withRequestsMadeViaParent } from '@angular/common/http';
import { EnvironmentProviders } from '@angular/core';

import { landingAuthInterceptor } from './landing-auth.interceptor';

/**
 * For the private route group's parent route: an HttpClient whose API requests carry the Owner's
 * token (`withRequestsMadeViaParent` then hands every request on to the app's client). Public pages
 * use the app's client and never send it. The session itself is app-wide (`LandingAuthService`).
 *
 * ```ts
 * { path: '', providers: [provideLandingAuthHttp()], loadComponent: () => import('./private.shell'), children: PRIVATE_ROUTES }
 * ```
 */
export function provideLandingAuthHttp(): EnvironmentProviders {
  return provideHttpClient(withInterceptors([landingAuthInterceptor]), withRequestsMadeViaParent());
}
