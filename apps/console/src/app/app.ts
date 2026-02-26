import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  FullPageSpinnerComponent,
  LoadingBarComponent,
  ToastContainerComponent,
} from '@portfolio/console/shared/ui';

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
export class App {}
