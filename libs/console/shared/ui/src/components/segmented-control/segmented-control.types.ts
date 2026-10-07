export interface SegmentedControlOption {
  value: string;
  label: string;
  icon?: string;
  /** Greys out this one segment; the caller says why next to the control. */
  disabled?: boolean;
}
