import type { Signal } from '@angular/core';

export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean | Signal<boolean>;
  onSaveAndContinue?(): Promise<boolean>;
}

export type UnsavedChangesResult = 'stay' | 'discard' | 'save';

export interface UnsavedChangesDialogData {
  showSave: boolean;
}
