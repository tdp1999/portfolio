import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import type { UnsavedChangesDialogData } from './unsaved-changes.dialog.types';

export type { HasUnsavedChanges, UnsavedChangesResult, UnsavedChangesDialogData } from './unsaved-changes.dialog.types';
export { unsavedChangesGuard, onBeforeUnload } from './unsaved-changes.dialog.util';

@Component({
  selector: 'console-unsaved-changes-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Unsaved Changes</h2>
    <mat-dialog-content>
      <p>You have unsaved changes. What would you like to do?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="'stay'">Stay</button>
      <button mat-button color="warn" [mat-dialog-close]="'discard'">Discard</button>
      @if (data.showSave) {
        <button mat-flat-button [mat-dialog-close]="'save'">Save & Continue</button>
      }
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnsavedChangesDialog {
  // ── DI ───────────────────────────────────────────────────────────────
  readonly data = inject<UnsavedChangesDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<UnsavedChangesDialog>);

  // ── Inputs ────────────────────────────────────────────────────────────

  // ── Outputs ───────────────────────────────────────────────────────────

  // ── Queries ───────────────────────────────────────────────────────────

  // ── Writable signals ──────────────────────────────────────────────────

  // ── Derived ───────────────────────────────────────────────────────────

  // ── Forms ─────────────────────────────────────────────────────────────

  // ── Plain state ───────────────────────────────────────────────────────
}
