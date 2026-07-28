import type { LandingCopyKey } from '@portfolio/landing/shared/ui';

/**
 * Maps `ProfileAvailability` to the green/amber/grey status-dot states the
 * landing system already uses (`available` = pill green, `busy` = amber,
 * `away` = grey). Open-to-work + freelancing both signal availability;
 * employed reads as busy; not-available collapses to away.
 */
export const AVAILABILITY_TO_DOT: Record<string, 'available' | 'busy' | 'away'> = {
  OPEN_TO_WORK: 'available',
  FREELANCING: 'available',
  EMPLOYED: 'busy',
  NOT_AVAILABLE: 'away',
};

/**
 * `ProfileAvailability` → copy key. The strings themselves live in
 * `LANDING_COPY` (task 388); this map only says which key each enum member
 * points at, so the label stays one lookup away from every other landing string.
 */
export const AVAILABILITY_COPY_KEYS: Record<string, LandingCopyKey> = {
  OPEN_TO_WORK: 'profile.availability.openToWork',
  FREELANCING: 'profile.availability.freelancing',
  EMPLOYED: 'profile.availability.employed',
  NOT_AVAILABLE: 'profile.availability.notAvailable',
};
