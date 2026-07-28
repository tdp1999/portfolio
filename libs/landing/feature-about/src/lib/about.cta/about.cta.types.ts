import type { LandingCopyKey } from '@portfolio/landing/shared/ui';

export type CtaItem = {
  readonly id: 'contact' | 'linkedin' | 'github' | 'cv';
  /** Label lives in `LANDING_COPY`; the item only points at it. */
  readonly labelKey: LandingCopyKey;
  readonly href: string;
  readonly kind?: 'internal' | 'external' | 'download';
};
