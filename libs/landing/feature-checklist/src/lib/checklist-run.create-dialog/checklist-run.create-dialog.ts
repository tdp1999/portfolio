import { ChangeDetectionStrategy, Component, effect, type ElementRef, input, output, viewChild } from '@angular/core';

import type { ChecklistDocSummary } from '@portfolio/shared/types';

import { ChecklistRunForm } from '../checklist-run.form/checklist-run.form';
import type { CreateChecklistRunInput } from '../checklist.types';

/**
 * "New run" as a modal over the runs list, so the list keeps its place. A native `<dialog>`: focus
 * is trapped, the page behind is inert, Escape or the backdrop cancels. The form is created on each
 * open, so it always starts empty with the name focused.
 */
@Component({
  selector: 'landing-checklist-run-create-dialog',
  imports: [ChecklistRunForm],
  templateUrl: './checklist-run.create-dialog.html',
  styleUrl: './checklist-run.create-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChecklistRunCreateDialog {
  readonly open = input(false);
  readonly templates = input.required<readonly ChecklistDocSummary[]>();
  readonly projects = input.required<readonly ChecklistDocSummary[]>();
  readonly submitting = input(false);
  readonly error = input<string | null>(null);

  readonly submitted = output<CreateChecklistRunInput>();
  readonly cancelled = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.open() && !dialog.open) dialog.showModal();
      else if (!this.open() && dialog.open) dialog.close();
    });
  }

  /** Escape (the dialog's `cancel`) is handed to the page, which owns `open`. */
  protected onCancel(event: Event): void {
    event.preventDefault();
    if (!this.submitting()) this.cancelled.emit();
  }

  /** A click on the backdrop lands on the dialog element itself, outside its card. */
  protected onClick(event: MouseEvent): void {
    if (event.target === event.currentTarget && !this.submitting()) this.cancelled.emit();
  }
}
