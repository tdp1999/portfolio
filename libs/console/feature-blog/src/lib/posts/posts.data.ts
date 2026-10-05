import type { FilterOption } from '@portfolio/console/shared/ui';
import type { BlogStatus } from '../blog.types';

export const STATUS_OPTIONS: FilterOption[] = [
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'UNLISTED', label: 'Unlisted' },
  { value: 'PRIVATE', label: 'Private' },
];

/** Tailwind classes of each status pill in the posts table. */
export const STATUS_BADGE_CLASSES: Record<BlogStatus, string> = {
  PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  DRAFT: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  PRIVATE: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  UNLISTED: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};
