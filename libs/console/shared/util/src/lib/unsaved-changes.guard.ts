import { ChangeDetectionStrategy, Component, inject, Signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CanDeactivateFn } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// ---------------------------------------------------------------------------
// Public interface — components must implement this
// ---------------------------------------------------------------------------

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean | Signal<boolean>;
  onSaveAndContinue?(): Promise<boolean>;
}

// ---------------------------------------------------------------------------
// Unsaved-changes dialog (3-action: Stay / Discard / Save & Continue)
// ---------------------------------------------------------------------------

export type UnsavedChangesResult = 'stay' | 'discard' | 'save';

interface UnsavedChangesDialogData {
  showSave: boolean;
}

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
export class UnsavedChangesDialogComponent {
  readonly data = inject<UnsavedChangesDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<UnsavedChangesDialogComponent>);
}

// ---------------------------------------------------------------------------
// Functional CanDeactivate guard
// ---------------------------------------------------------------------------

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = async (component) => {
  const dirty = component.hasUnsavedChanges();
  const isDirty = typeof dirty === 'function' ? (dirty as Signal<boolean>)() : dirty;

  if (!isDirty) return true;

  const dialog = inject(MatDialog);
  const showSave = typeof component.onSaveAndContinue === 'function';

  const result = await firstValueFrom(
    dialog
      .open<
        UnsavedChangesDialogComponent,
        UnsavedChangesDialogData,
        UnsavedChangesResult
      >(UnsavedChangesDialogComponent, { data: { showSave }, disableClose: true })
      .afterClosed()
  );

  if (result === 'discard') return true;

  if (result === 'save' && component.onSaveAndContinue) {
    return component.onSaveAndContinue();
  }

  // 'stay' or dialog dismissed
  return false;
};

// ---------------------------------------------------------------------------
// beforeunload helper — call in component constructor via effect or HostListener
// ---------------------------------------------------------------------------

export function onBeforeUnload(event: BeforeUnloadEvent, isDirty: boolean): void {
  if (isDirty) {
    event.preventDefault();
    // Modern browsers ignore custom messages but require returnValue to be set
    event.returnValue = '';
  }
}
