import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideClientHydration, withEventReplay, withHttpTransferCacheOptions } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import {
  COMMAND_PALETTE_SEARCH_SOURCES,
  provideIcons,
  lucideProvider,
  type CommandResult,
} from '@portfolio/landing/shared/ui';
import { DDL_GROUPS, DDL_REGISTRY, entryFragment, entryLink } from './pages/ddl/ddl.registry';

// DDL design-system entries, exposed to the command palette as search-only
// results (they surface when the user types, never in the default list).
const DDL_COMMAND_RESULTS: readonly CommandResult[] = DDL_REGISTRY.map((entry) => ({
  id: `ddl-${entry.slug}`,
  kind: 'doc' as const,
  title: entry.title,
  description: `DDL › ${DDL_GROUPS.find((g) => g.id === entry.group)?.label ?? ''}`,
  href: entryLink(entry),
  fragment: entryFragment(entry),
  iconName: 'layout-grid',
}));

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(
      withEventReplay(),
      // Reuse SSR-fetched HTTP responses on client → no double GET on hydration.
      withHttpTransferCacheOptions({ includePostRequests: false, filter: () => true })
    ),
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      appRoutes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' })
    ),
    provideIcons(lucideProvider),
    provideHttpClient(withFetch()),
    { provide: COMMAND_PALETTE_SEARCH_SOURCES, useValue: DDL_COMMAND_RESULTS },
    // Anchor scroll offset for sticky header (h-16 = 64px) + breathing room (16px)
    provideAppInitializer(() => {
      inject(ViewportScroller).setOffset([0, 80]);
    }),
  ],
};
