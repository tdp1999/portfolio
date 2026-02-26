import { Component, computed, input } from '@angular/core';

const SIZE_MAP = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' } as const;

@Component({
  selector: 'console-spinner-overlay',
  standalone: true,
  template: `
    @if (loading()) {
      <div
        class="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-white/70 dark:bg-gray-900/70"
      >
        <div
          [class]="spinnerSize()"
          class="animate-spin rounded-full border-2 border-gray-300 border-t-blue-500"
        ></div>
      </div>
    }
  `,
})
export class SpinnerOverlayComponent {
  loading = input.required<boolean>();
  size = input<'sm' | 'md' | 'lg'>('md');

  protected spinnerSize = computed(() => SIZE_MAP[this.size()]);
}
