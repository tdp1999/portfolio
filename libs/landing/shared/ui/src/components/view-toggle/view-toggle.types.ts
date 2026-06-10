export interface ViewToggleOption {
  readonly id: string;
  readonly label: string;
  /** Icon name registered in the icon provider. */
  readonly icon: string;
  /** Longer description shown in the hover/focus tooltip. Falls back to `label` if omitted. */
  readonly description?: string;
}
