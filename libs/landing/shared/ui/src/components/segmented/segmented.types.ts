export interface SegmentOption {
  readonly id: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export type LandingSegmentedVariant = 'apple' | 'hairline' | 'underline';
