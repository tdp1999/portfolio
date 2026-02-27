import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import {
  AuthStore,
  ThemeService,
  authInterceptor,
  csrfInterceptor,
  errorInterceptor,
  provideApi,
  refreshInterceptor,
} from '@portfolio/console/shared/data-access';
import { environment } from '../environments/environment';
import { appRoutes } from './app.routes';
import { provideErrorHandler } from './error-handler.provider';
import { THIRD_PARTY_PROVIDER } from '@portfolio/console/shared/util';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([errorInterceptor, csrfInterceptor, authInterceptor, refreshInterceptor])
    ),
    provideErrorHandler(),
    provideApi({
      baseUrl: environment.apiBaseUrl,
      urlPrefix: 'api',
      timeout: 30_000,
    }),
    provideAppInitializer(() => inject(AuthStore).bootstrap()),
    provideAppInitializer(() => {
      inject(ThemeService);
    }),

    // Third Party Providers
    ...THIRD_PARTY_PROVIDER,
  ],
};
