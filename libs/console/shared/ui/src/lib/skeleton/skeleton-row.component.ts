import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Single skeleton table row. Renders `columns` cells with a shimmer block inside.
 * Used by `<console-skeleton-table>` but exported standalone for custom layouts.
 */
@Component({
  selector: 'console-skeleton-row',
  standalone: true,
  template: `
    <tr class="skeleton-row">
      @for (i of cells(); track i) {
        <td class="px-4 py-4">
          <div class="skeleton-bar" [style.width]="cellWidths()[i]"></div>
        </td>
      }
    </tr>
  `,
  styles: `
    :host {
      display: contents;
    }

    .skeleton-bar {
      height: 0.875rem;
      border-radius: 0.25rem;
      background: var(--skeleton-bg, rgb(229 231 235));
      animation: skeleton-pulse 1.4s ease-in-out infinite;
    }

    :host-context(.dark) .skeleton-bar,
    .dark :host .skeleton-bar {
      background: var(--skeleton-bg-dark, rgb(55 65 81));
    }

    @keyframes skeleton-pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.55;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .skeleton-bar {
        animation: none;
        opacity: 0.7;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonRowComponent {
  readonly columns = input<number>(4);
  readonly widths = input<string[] | undefined>(undefined);

  protected readonly cells = computed(() => Array.from({ length: this.columns() }, (_, i) => i));

  protected readonly cellWidths = computed<string[]>(() => {
    const explicit = this.widths();
    if (explicit && explicit.length) {
      return Array.from({ length: this.columns() }, (_, i) => explicit[i % explicit.length]);
    }
    // Default: vary widths so it doesn't look mechanical
    const defaults = ['80%', '60%', '70%', '50%', '75%', '55%'];
    return Array.from({ length: this.columns() }, (_, i) => defaults[i % defaults.length]);
  });
}
