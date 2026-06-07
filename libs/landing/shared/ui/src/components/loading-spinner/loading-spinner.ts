import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Block-level loading indicator for post-hydration data fetches (e.g. archive pages on
 * client-side navigation). Pair with `asyncResource()` from `@portfolio/shared/async-state`:
 *
 * ```html
 * @if (projects.showSpinner()) {
 *   <landing-loading-spinner message="Loading projects…" />
 * } @else if (projects.isEmpty()) { ... }
 * ```
 *
 * Don't use for inline button-loading or full-page initial loads — those have their own
 * patterns (button has internal `[loading]`; SSR-rendered routes render with data already).
 */
@Component({
  selector: 'landing-loading-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center justify-center py-24 text-center" role="status" [attr.aria-live]="'polite'">
      <svg
        class="loading-spinner__icon text-landing-text-500"
        [attr.width]="size()"
        [attr.height]="size()"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.2" stroke-width="2" />
        <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
      @if (message()) {
        <p class="text-landing-text-500 text-body-sm mt-4">{{ message() }}</p>
      }
      <span class="sr-only">{{ message() || 'Loading' }}</span>
    </div>
  `,
  styles: `
    @use 'base/prefers' as prefers;
    .loading-spinner__icon {
      animation: loading-spinner-rotate 0.9s linear infinite;
    }
    @keyframes loading-spinner-rotate {
      to {
        transform: rotate(360deg);
      }
    }
    .loading-spinner__icon {
      @include prefers.reduce-motion {
        animation-duration: 2.4s;
      }
    }
  `,
})
export class LoadingSpinner {
  readonly message = input<string>('');
  readonly size = input<number>(32);
}
