import type { LandingStatusDotState } from '@portfolio/landing/shared/ui';

/**
 * Maps `ProfileAvailability` to the green/amber/grey status-dot states the
 * landing system already uses (`available` = pill green, `busy` = amber,
 * `away` = grey). Open-to-work + freelancing both signal availability;
 * employed reads as busy; not-available collapses to away.
 */
export const AVAILABILITY_TO_DOT: Record<string, LandingStatusDotState> = {
  OPEN_TO_WORK: 'available',
  FREELANCING: 'available',
  EMPLOYED: 'busy',
  NOT_AVAILABLE: 'away',
};

export const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const VI_MONTHS = [
  'Tháng 1',
  'Tháng 2',
  'Tháng 3',
  'Tháng 4',
  'Tháng 5',
  'Tháng 6',
  'Tháng 7',
  'Tháng 8',
  'Tháng 9',
  'Tháng 10',
  'Tháng 11',
  'Tháng 12',
] as const;

export const AVAILABILITY_LABELS_VI: Record<string, string> = {
  OPEN_TO_WORK: 'Sẵn sàng nhận việc',
  FREELANCING: 'Đang nhận freelance',
  EMPLOYED: 'Đang làm full-time',
  NOT_AVAILABLE: 'Không nhận thêm',
};
