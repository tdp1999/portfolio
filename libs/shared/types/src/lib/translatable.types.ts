export type Locale = 'en' | 'vi';

export interface TranslatableJson {
  en: string;
  vi: string;
}

export interface OptionalTranslatableJson {
  en?: string;
  vi?: string;
}

export interface PartialTranslatableJson {
  en?: string;
  vi?: string;
}

export const SOCIAL_PLATFORM = {
  GITHUB: 'GITHUB',
  LINKEDIN: 'LINKEDIN',
  TWITTER: 'TWITTER',
  BLUESKY: 'BLUESKY',
  STACKOVERFLOW: 'STACKOVERFLOW',
  DEV_TO: 'DEV_TO',
  HASHNODE: 'HASHNODE',
  WEBSITE: 'WEBSITE',
  OTHER: 'OTHER',
} as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORM)[keyof typeof SOCIAL_PLATFORM];

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  handle?: string;
}

export interface Certification {
  name: string;
  issuer: string;
  year: number;
  url?: string;
}

export interface ResumeUrls {
  en?: string;
  vi?: string;
}

export const OPEN_TO_VALUE = {
  FREELANCE: 'FREELANCE',
  CONSULTING: 'CONSULTING',
  SIDE_PROJECT: 'SIDE_PROJECT',
  FULL_TIME: 'FULL_TIME',
  SPEAKING: 'SPEAKING',
  OPEN_SOURCE: 'OPEN_SOURCE',
} as const;

export type OpenToValue = (typeof OPEN_TO_VALUE)[keyof typeof OPEN_TO_VALUE];
