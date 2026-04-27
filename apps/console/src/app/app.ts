import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  FullPageSpinnerComponent,
  LoadingBarComponent,
  SpinnerService,
  ToastContainerComponent,
} from '@portfolio/console/shared/ui';
import { AuthStore } from '@portfolio/console/shared/data-access';

@Component({
  selector: 'console-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent, LoadingBarComponent, FullPageSpinnerComponent],
  template: `
    <console-loading-bar />
    <router-outlet />
    <console-toast-container />
    <console-full-page-spinner />
  `,
})
export class App {
  authStore = inject(AuthStore);
  spinnerService = inject(SpinnerService);

  constructor() {
    effect(() => {
      if (this.authStore.isBootstrapping()) {
        this.spinnerService.show();
      } else {
        this.spinnerService.hide();
      }
    });
  }
}
