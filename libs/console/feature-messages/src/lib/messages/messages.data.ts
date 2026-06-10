import type { FilterOption } from '@portfolio/console/shared/ui';

export const STATUS_OPTIONS: FilterOption[] = [
  { value: 'UNREAD', label: 'Unread' },
  { value: 'READ', label: 'Read' },
  { value: 'REPLIED', label: 'Replied' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const PURPOSE_OPTIONS: FilterOption[] = [
  { value: 'GENERAL', label: 'General' },
  { value: 'JOB_OPPORTUNITY', label: 'Job Opportunity' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'COLLABORATION', label: 'Collaboration' },
  { value: 'BUG_REPORT', label: 'Bug Report' },
  { value: 'OTHER', label: 'Other' },
];
