import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SkeletonRowComponent } from './skeleton-row.component';

/**
 * Drop-in skeleton placeholder for a Material table while data is loading.
 * Render in place of `<table mat-table>` (or alongside, gated by `loading()`)
 * during initial load / filter change / pagination change.
 *
 * For background refresh after a mutation, do NOT render this — use the
 * top progress bar (`ProgressBarService`) instead. See `.context/design/loading.md`.
 */
@Component({
  selector: 'console-skeleton-table',
  standalone: true,
  imports: [SkeletonRowComponent],
  template: `
    <table class="skeleton-table w-full">
      <thead>
        <tr>
          @for (i of headerCells(); track i) {
            <th class="px-3 py-3 text-left">
              <div class="skeleton-header"></div>
            </th>
          }
        </tr>
      </thead>
      <tbody>
        @for (row of rowIndices(); track row) {
          <console-skeleton-row [columns]="columns()" [widths]="widths()" />
        }
      </tbody>
    </table>
  `,
  styles: `
    :host {
      display: block;
    }

    .skeleton-table {
      border-collapse: collapse;
    }

    .skeleton-table thead th {
      border-bottom: 1px solid var(--mat-sys-outline-variant, rgb(229 231 235));
    }

    .skeleton-table tbody tr {
      border-bottom: 1px solid var(--mat-sys-outline-variant, rgb(229 231 235));
    }

    .skeleton-header {
      height: 0.75rem;
      width: 40%;
      border-radius: 0.25rem;
      background: rgb(229 231 235);
      animation: skeleton-pulse 1.4s ease-in-out infinite;
    }

    :host-context(.dark) .skeleton-header,
    .dark :host .skeleton-header {
      background: rgb(55 65 81);
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
      .skeleton-header {
        animation: none;
        opacity: 0.7;
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonTableComponent {
  readonly columns = input<number>(4);
  readonly rows = input<number>(8);
  readonly widths = input<string[] | undefined>(undefined);

  protected readonly headerCells = computed(() => Array.from({ length: this.columns() }, (_, i) => i));
  protected readonly rowIndices = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
}
