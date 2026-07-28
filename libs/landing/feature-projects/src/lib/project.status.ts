import type { Locale } from '@portfolio/shared/types';
import type { ProjectLifecycleStatus } from '@portfolio/landing/shared/data-access';
import { resolveCopy, type LandingCopyKey } from '@portfolio/landing/shared/ui';

/**
 * Lifecycle-status labels, shared by the /projects filter chips and the detail
 * page's metadata rail.
 *
 * Flat here rather than inside either page's folder because both read it: the
 * filter chips used to render the raw enum (`LIVE`, `SHIPPED`) while the detail
 * rail rendered title case (`Live`, `Shipped`) from its own map. One resolver
 * means the two surfaces cannot disagree again.
 */
const STATUS_KEYS: Record<ProjectLifecycleStatus, LandingCopyKey> = {
  LIVE: 'project.status.live',
  SHIPPED: 'project.status.shipped',
  ARCHIVED: 'project.status.archived',
  BETA: 'project.status.beta',
  ONGOING: 'project.status.ongoing',
};

export function projectStatusLabel(status: ProjectLifecycleStatus, locale: Locale): string {
  return resolveCopy(STATUS_KEYS[status], locale);
}
