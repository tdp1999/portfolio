import type { VersionInfo } from '@portfolio/landing/shared/data-access';

export type VersionStatus = 'loading' | 'ready' | 'error';

export interface VersionResult {
  status: VersionStatus;
  info: VersionInfo | null;
}
