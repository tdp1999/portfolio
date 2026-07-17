import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

/**
 * Floating bulk-action bar for list pages. Appears (bottom-centered) whenever one
 * or more rows are selected. Presentational only: it shows the selection count and
 * a "Clear" control, and projects the page's own action buttons — each list page
 * decides which actions apply (delete, restore, publish, …). Pair it with a
 * signal-held selection (see `posts.ts`) + a checkbox column in the table.
 *
 * ```html
 * <console-bulk-action-bar [count]="selectedCount()" (clear)="clearSelection()">
 *   <button mat-button (click)="bulkDelete()">Delete</button>
 * </console-bulk-action-bar>
 * ```
 */
@Component({
  selector: 'console-bulk-action-bar',
  standalone: true,
  imports: [MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bulk-action-bar.html',
  styleUrl: './bulk-action-bar.scss',
})
export class BulkActionBar {
  /** Number of currently-selected rows. The bar is hidden when this is 0. */
  readonly count = input.required<number>();

  /** Emitted when the user clears the selection. */
  readonly clear = output<void>();
}
