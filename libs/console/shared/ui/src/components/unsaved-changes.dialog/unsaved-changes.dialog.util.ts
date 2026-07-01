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

  const dialog = inject(MatDialog);
  const showSave = typeof component.onSaveAndContinue === 'function';

  const result = await firstValueFrom(
    dialog
      .open<
        UnsavedChangesDialog,
        UnsavedChangesDialogData,
        UnsavedChangesResult
      >(UnsavedChangesDialog, { data: { showSave }, disableClose: true })
      .afterClosed()
  );

  if (result === 'discard') return true;

  if (result === 'save' && component.onSaveAndContinue) {
    return component.onSaveAndContinue();
  }

  // 'stay' or dialog dismissed
  return false;
};

export function onBeforeUnload(event: BeforeUnloadEvent, isDirty: boolean): void {
  if (isDirty) {
    event.preventDefault();
    // Modern browsers ignore custom messages but require returnValue to be set
    event.returnValue = '';
  }
}
