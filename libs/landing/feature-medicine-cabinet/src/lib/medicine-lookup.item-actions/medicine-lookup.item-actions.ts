import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { Icon } from '@portfolio/landing/shared/ui';

import type { LookupRow } from '../medicine-lookup.util';

/**
 * The note icon (only when the item has a note, R6.9) and the edit icon of one item. The edit icon is
 * a real link to the console edit page, so it keeps open-in-new-tab (R16.1). Icons are lucide
 * `sticky-note` and `pencil`.
 */
@Component({
  selector: 'landing-medicine-lookup-item-actions',
  imports: [Icon],
  template: `
    @if (row().note) {
      <button
        type="button"
        class="item-actions__btn"
        [class.item-actions__btn--active]="row().noteOpen"
        data-testid="note-toggle"
        [attr.aria-expanded]="row().noteOpen ? 'true' : 'false'"
        [attr.aria-label]="row().noteOpen ? hideNoteLabel() : showNoteLabel()"
        (click)="noteToggle.emit()"
      >
        <landing-icon name="sticky-note" [size]="16" />
      </button>
    }
    <a
      class="item-actions__btn"
      data-testid="edit-link"
      [href]="row().editHref"
      [attr.aria-label]="row().editLabel"
      (click)="onEditClick($event)"
    >
      <landing-icon name="pencil" [size]="16" />
    </a>
  `,
  styles: `
    :host {
      display: inline-flex;
      justify-content: flex-end;
      gap: 4px;
    }
    .item-actions__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      border: 0;
      border-radius: 4px;
      background: transparent;
      color: var(--landing-text-500);
      cursor: pointer;
      transition:
        color 160ms ease,
        background-color 160ms ease;
    }
    .item-actions__btn:hover,
    .item-actions__btn--active {
      color: var(--landing-accent);
      background: var(--landing-ink-1);
    }
    .item-actions__btn:focus-visible {
      outline: 2px solid var(--landing-accent);
      outline-offset: 2px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MedicineLookupItemActions {
  readonly row = input.required<LookupRow>();
  readonly showNoteLabel = input.required<string>();
  readonly hideNoteLabel = input.required<string>();
  readonly noteToggle = output<void>();
  /** Fired before the browser follows the edit link, so the page can save its scroll position. */
  readonly editOpen = output<void>();

  /** A modified click opens a new tab and leaves this page as it is, so nothing is saved for it. */
  protected onEditClick(event: MouseEvent): void {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    this.editOpen.emit();
  }
}
