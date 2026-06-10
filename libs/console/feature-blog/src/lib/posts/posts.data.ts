import type { FilterOption } from '@portfolio/console/shared/ui';

export const STATUS_OPTIONS: FilterOption[] = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'UNLISTED', label: 'Unlisted' },
  { value: 'PRIVATE', label: 'Private' },
];
