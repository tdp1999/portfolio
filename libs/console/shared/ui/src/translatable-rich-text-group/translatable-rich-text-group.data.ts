import type { SegmentedControlOption } from '../segmented-control/segmented-control.types';
import type { RichTextLanguageConfig } from './translatable-rich-text-group.types';

export const DEFAULT_LANGUAGES: RichTextLanguageConfig[] = [
  { key: 'en', label: 'EN' },
  { key: 'vi', label: 'VI' },
];

/** Segmented-control segments: single locale or both stacked. */
export const VIEW_OPTIONS: ReadonlyArray<SegmentedControlOption> = [
  { value: 'en', label: 'EN' },
  { value: 'vi', label: 'VI' },
  { value: 'all', label: 'All' },
];
