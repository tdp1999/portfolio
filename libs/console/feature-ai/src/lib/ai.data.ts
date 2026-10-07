import type { SegmentedControlOption } from '@portfolio/console/shared/ui';

import type { AiCallStatus, AiUsageRange } from './ai.types';

export const AI_RANGE_OPTIONS: SegmentedControlOption[] = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
];

export const AI_RANGE_LABELS: Record<AiUsageRange, string> = {
  '24h': 'last 24 hours',
  '7d': 'last 7 days',
  '30d': 'last 30 days',
};

export const AI_STATUS_LABELS: Record<AiCallStatus, string> = {
  SUCCEEDED: 'Succeeded',
  FAILED: 'Failed',
  RATE_LIMITED: 'Rate limited',
};

export const AI_STATUS_BADGES: Record<AiCallStatus, string> = {
  SUCCEEDED: 'console-badge--success',
  FAILED: 'console-badge--danger',
  RATE_LIMITED: 'console-badge--warn',
};

/** What each usage feature is for, in the Owner's words. Unknown features show their raw name. */
export const AI_FEATURE_LABELS: Record<string, string> = {
  'radar.analyze': 'Radar analysis',
  'radar.transcript': 'Radar transcript',
  'radar.brief': 'Radar brief',
  'ai.test': 'Connection test',
};

/** Console pages for the records a call can serve. */
export const AI_REF_ROUTES: Record<string, (id: string) => string[]> = {
  'radar-item': (id) => ['/radar/items', id],
  'radar-brief': (id) => ['/radar/briefs', id],
};

export const AI_STUDIO_USAGE_URL = 'https://aistudio.google.com/usage';
export const AI_STUDIO_RATE_LIMIT_URL = 'https://aistudio.google.com/rate-limit';
export const GEMINI_PRICING_URL = 'https://ai.google.dev/gemini-api/docs/pricing';
