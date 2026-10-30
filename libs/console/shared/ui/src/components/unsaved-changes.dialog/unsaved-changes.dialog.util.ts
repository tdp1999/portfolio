import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import type { HasUnsavedChanges, UnsavedChangesResult, UnsavedChangesDialogData } from './unsaved-changes.dialog.types';
import type { Signal } from '@angular/core';
import { UnsavedChangesDialog } from './unsaved-changes.dialog';

export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = async (component) => {
  const dirty = component.hasUnsavedChanges();
  const isDirty = typeof dirty === 'function' ? (dirty as Signal<boolean>)() : dirty;

  if (!isDirty) return true;

  const result = await askUnsavedChanges(inject(MatDialog), typeof component.onSaveAndContinue === 'function');

  if (result === 'discard') return true;

  if (result === 'save' && component.onSaveAndContinue) {
    return component.onSaveAndContinue();
  }

  // 'stay' or dialog dismissed
  return false;
};

/**
 * Opens `UnsavedChangesDialog` and resolves with the choice, or `undefined` when it is dismissed.
 * The guard uses it, and so does a page that leaves without the router (for example to another app).
 */
export function askUnsavedChanges(dialog: MatDialog, showSave: boolean): Promise<UnsavedChangesResult | undefined> {
  return firstValueFrom(
    dialog
      .open<
        UnsavedChangesDialog,
        UnsavedChangesDialogData,
        UnsavedChangesResult
      >(UnsavedChangesDialog, { data: { showSave }, disableClose: true })
      .afterClosed()
  );
}

export function onBeforeUnload(event: BeforeUnloadEvent, isDirty: boolean): void {
  if (isDirty) {
    event.preventDefault();
    // Modern browsers ignore custom messages but require returnValue to be set
    event.returnValue = '';
  }
}
