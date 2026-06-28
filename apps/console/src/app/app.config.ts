import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import {
  AuthStore,
  MediaService,
  ThemeService,
  authInterceptor,
  csrfInterceptor,
  errorInterceptor,
  provideApi,
  refreshInterceptor,
} from '@portfolio/console/shared/data-access';
import {
  MediaPickerDialogComponent,
  ToastService,
  type MediaPickerDataSource,
  type MediaPickerDialogData,
} from '@portfolio/console/shared/ui';
import { RewardEarlyErrorStateMatcher, SERVER_ERROR_FALLBACK, type MediaItem } from '@portfolio/console/shared/util';
import { RTE_EDITOR } from '@portfolio/shared/features/rte-contract';
import { MEDIA_PICKER_HOOK, RteTiptapEditor, type MediaResult } from '@portfolio/shared/features/rte-tiptap';
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
    { provide: ErrorStateMatcher, useClass: RewardEarlyErrorStateMatcher },
    {
      provide: SERVER_ERROR_FALLBACK,
      useFactory: () => {
        const toast = inject(ToastService);
        return { showError: (msg: string) => toast.error(msg) };
      },
    },
    provideApi({
      baseUrl: environment.apiBaseUrl,
      urlPrefix: 'api',
      timeout: 30_000,
    }),

    // Rich-text editor: bind the contract token to the concrete Tiptap impl, and
    // supply the image-picker hook that opens the console's MediaPickerDialog.
    { provide: RTE_EDITOR, useValue: RteTiptapEditor },
    {
      provide: MEDIA_PICKER_HOOK,
      useFactory: (): (() => Promise<MediaResult | null>) => {
        const dialog = inject(MatDialog);
        const media = inject(MediaService);
        const dataSource: MediaPickerDataSource = {
          list: (params) => media.list(params),
          upload: (file, folder) => media.upload(file, { folder }),
          getById: (id) => media.getById(id),
          getByIdSilent: (id) => media.getByIdSilent(id),
        };
        return async () => {
          const picked = await firstValueFrom(
            dialog
              .open<MediaPickerDialogComponent, MediaPickerDialogData, MediaItem | undefined>(
                MediaPickerDialogComponent,
                {
                  data: { mode: 'single', mimeFilter: 'image/', dataSource } satisfies MediaPickerDialogData,
                  width: '1280px',
                  maxHeight: '80vh',
                }
              )
              .afterClosed()
          );
          if (!picked) return null;
          return { id: picked.id, url: picked.url, alt: picked.altText ?? undefined };
        };
      },
    },

    provideAppInitializer(() => {
      inject(AuthStore).bootstrap();
    }),
    provideAppInitializer(() => {
      inject(ThemeService);
    }),

    // Third Party Providers
    ...THIRD_PARTY_PROVIDER,
  ],
};
