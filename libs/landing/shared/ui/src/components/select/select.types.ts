export interface SelectOption<T = string> {
  /** Underlying value (e.g. 'en'). */
  readonly value: T;
  /** Primary display label inside the menu (e.g. 'English'). */
  readonly label: string;
  /** Optional secondary label (e.g. 'en' code under the main name). */
  readonly sublabel?: string;
  /** Optional lucide icon name rendered at the left of the menu row. */
  readonly iconName?: string;
  readonly disabled?: boolean;
}

export type SelectAlign = 'left' | 'right';

/**
 * How the selected value is rendered inside the closed-state trigger.
 * - `label` — the option's `label` (e.g. "English"). Default.
 * - `code`  — the `value` uppercased + cast to string (e.g. "EN").
 * - `sublabel` — the option's `sublabel` if present, else falls back to label.
 */
export type SelectTriggerValue = 'label' | 'code' | 'sublabel';
