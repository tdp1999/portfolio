import { ChangeDetectionStrategy, Component, effect, type ElementRef, input, output, viewChild } from '@angular/core';

import { Button } from '@portfolio/landing/shared/ui';

/**
 * A yes/no question before a change that is hard to take back (delete a group, check a whole phase).
 * A native modal `<dialog>`: focus is trapped, the page behind is inert, and Escape or the backdrop
 * cancels. Its Escape stops at the dialog so an open ref panel or a DDL stage behind it stays put.
 */
@Component({
  selector: 'landing-checklist-confirm-dialog',
  imports: [Button],
  templateUrl: './checklist.confirm-dialog.html',
  styleUrl: './checklist.confirm-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChecklistConfirmDialog {
  readonly open = input(false);
  readonly heading = input.required<string>();
  readonly message = input('');
  readonly confirmLabel = input('Confirm');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) dialog.showModal();
      else if (!this.open() && dialog.open) dialog.close();
    });
  }

  /** Escape (the dialog's `cancel`) closes it natively; the page hears it as a cancel. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    this.cancelled.emit();
  }

  /** A click on the backdrop lands on the dialog element itself, outside its card. */
  protected onClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancelled.emit();
  }
}
