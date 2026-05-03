import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideIcons, lucideProvider } from '@portfolio/landing/shared/ui';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
    ),
    provideIcons(lucideProvider),
    provideHttpClient(withFetch()),
    // Anchor scroll offset for sticky header (h-16 = 64px) + breathing room (16px)
    provideAppInitializer(() => {
      inject(ViewportScroller).setOffset([0, 80]);
    }),
  ],
};
