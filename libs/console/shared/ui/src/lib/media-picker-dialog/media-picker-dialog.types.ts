export interface MediaPickerDialogData {
  mode: 'single' | 'multi';
  selectedIds?: string[];
  mimeFilter?: string;
}

export type MediaPickerDialogResult = string | string[] | undefined;
