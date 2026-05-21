import { type SocialPlatform } from '@portfolio/shared/types';

export const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  FREELANCE: 'Freelance',
  INTERNSHIP: 'Internship',
  SELF_EMPLOYED: 'Self Employed',
};

export const LOCATION_TYPE_LABELS: Record<string, string> = {
  REMOTE: 'Remote',
  HYBRID: 'Hybrid',
  ONSITE: 'Onsite',
};

export const SKILL_CATEGORY_LABELS: Record<string, string> = {
  TECHNICAL: 'Technical',
  TOOLS: 'Tools',
  ADDITIONAL: 'Additional',
};

export const SKILL_TIER_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  FREQUENT: 'Frequent',
  SHIPPED: 'Shipped',
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
};

export const BLOG_POST_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  PRIVATE: 'Private',
  UNLISTED: 'Unlisted',
};

/**
 * Display label for each `SocialPlatform`. Single source of truth — landing UI
 * (footer banner, footer signature, get-in-touch) all read from this map.
 */
export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  GITHUB: 'GitHub',
  LINKEDIN: 'LinkedIn',
  TWITTER: 'X / Twitter',
  BLUESKY: 'Bluesky',
  STACKOVERFLOW: 'Stack Overflow',
  DEV_TO: 'Dev.to',
  HASHNODE: 'Hashnode',
  TELEGRAM: 'Telegram',
  ZALO: 'Zalo',
  WEBSITE: 'Website',
  OTHER: 'External link',
};
