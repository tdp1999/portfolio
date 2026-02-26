import { Component, inject } from '@angular/core';
import { SpinnerService } from './spinner.service';

@Component({
  selector: 'console-full-page-spinner',
  standalone: true,
  template: `
    @if (spinnerService.visible()) {
      <div class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
        <div
          class="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white"
        ></div>
      </div>
    }
  `,
})
export class FullPageSpinnerComponent {
  protected readonly spinnerService = inject(SpinnerService);
}
