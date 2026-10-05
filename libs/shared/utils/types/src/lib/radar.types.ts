/** Who a Radar item is about. Shared by the API enrichment schema and the console filters. */
export const RADAR_PROVIDER_TAGS = [
  'anthropic',
  'openai',
  'google',
  'meta',
  'xai',
  'deepseek',
  'opensource',
  'other',
] as const;
export type RadarProviderTag = (typeof RADAR_PROVIDER_TAGS)[number];

/** What kind of post a Radar item is. Shared by the API enrichment schema and the console filters. */
export const RADAR_CONTENT_TYPES = ['news', 'tool', 'workflow', 'opinion', 'tutorial', 'promo'] as const;
export type RadarContentType = (typeof RADAR_CONTENT_TYPES)[number];
