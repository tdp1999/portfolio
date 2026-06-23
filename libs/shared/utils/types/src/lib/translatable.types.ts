export type Locale = 'en' | 'vi';

export interface TranslatableStringArray {
  en: string[];
  vi: string[];
}

export interface TranslatableJson {
  en: string;
  vi: string;
}

/**
 * A single rich-text document payload (Tiptap/ProseMirror JSON). Opaque at the
 * storage/API boundary; the canonical typed `EditorDocument` arrives with the
 * `rte-core` lib (RTE epic Phase 3). Used as the `*Json` half of the
 * 3-column rich-text storage pattern.
 */
export type RichTextDocument = Record<string, unknown>;

/**
 * Translatable rich-text canonical JSON — one document per locale. Stored in the
 * `*Json` columns; its sanitized HTML cache (`*Html`) reuses {@link TranslatableJson}
 * (one HTML string per locale).
 */
export interface TranslatableRichText {
  en: RichTextDocument;
  vi: RichTextDocument;
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
  TELEGRAM: 'TELEGRAM',
  ZALO: 'ZALO',
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

export interface ResumeEntry {
  url: string;
  name: string;
}

export interface ResumeUrls {
  en?: ResumeEntry;
  vi?: ResumeEntry;
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
