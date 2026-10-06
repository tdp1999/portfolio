import { CdkConnectedOverlay, CdkOverlayOrigin, type ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * The second tier of a filter bar: a "Filters (n)" button that opens a panel of the filters used
 * now and then. The caller projects the controls; their values add to the bar's own filters, and
 * the chip row under the bar shows both groups. Selects inside work because the panel closes on
 * its backdrop or Escape, never on a click within it.
 */
@Component({
  selector: 'console-filter-more',
  standalone: true,
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, MatButtonModule, MatIconModule],
  template: `
    <button
      mat-stroked-button
      type="button"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      class="filter-more__trigger"
      [attr.aria-expanded]="open()"
      aria-haspopup="dialog"
      (click)="open.set(!open())"
    >
      <mat-icon class="icon-sm">tune</mat-icon>
      {{ label() }}
      @if (count()) {
        <span class="filter-more__count">{{ count() }}</span>
      }
    </button>
    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="open()"
      [cdkConnectedOverlayPositions]="positions"
      cdkConnectedOverlayHasBackdrop
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="open.set(false)"
      (detach)="open.set(false)"
      (overlayKeydown)="onKeydown($event)"
    >
      <div class="filter-more__panel" role="dialog" [attr.aria-label]="label()">
        <div class="filter-more__body">
          <ng-content />
        </div>
        <div class="filter-more__foot">
          <button mat-button type="button" [disabled]="!count()" (click)="clear.emit()">Clear these</button>
          <button mat-flat-button type="button" (click)="open.set(false)">Done</button>
        </div>
      </div>
    </ng-template>
  `,
  styles: `
    .filter-more__trigger {
      height: 40px;
    }

    .filter-more__count {
      margin-left: 4px;
      padding: 0 8px;
      border-radius: 999px;
      background: var(--color-primary);
      color: var(--color-text-on-primary);
      font-size: var(--text-xs);
      line-height: var(--leading-normal);
    }

    .filter-more__panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
      width: 320px;
      margin-top: 4px;
      padding: 16px;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      background: var(--color-surface);
      box-shadow: 0 8px 24px rgb(0 0 0 / 16%);
    }

    .filter-more__body {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* Each projected select takes the panel's width. */
    .filter-more__body ::ng-deep .mat-mdc-form-field {
      width: 100%;
    }

    .filter-more__foot {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterMore {
  readonly label = input('Filters');
  /** How many of the panel's filters are set; shown on the button. */
  readonly count = input(0);
  readonly clear = output<void>();

  protected readonly open = signal(false);
  protected readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  ];

  protected onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') this.open.set(false);
  }
}
