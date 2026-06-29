import type { LandingChipProminence } from '@portfolio/landing/shared/ui';
import type { SkillTier } from '@portfolio/landing/shared/data-access';

export const TIER_PROMINENCE: Record<SkillTier, LandingChipProminence> = {
  DAILY: 'strongest',
  FREQUENT: 'strong',
  SHIPPED: 'default',
};
