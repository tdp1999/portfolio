import { ResumeUrls, TranslatableJson } from '@portfolio/shared/types';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';
import { PROFILE_SECTIONS } from './profile.data';

/** Bilingual rich-text document pair — the canonical RTE shape per locale. */
export interface TranslatableRichText {
  en: EditorDocument;
  vi: EditorDocument;
}

// ── Full admin profile response (GET /admin/profile) ───────────────────────
export interface ProfileAdminResponse {
  id: string;
  userId: string;
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;
  /** RTE canonical doc for the long bio. Null until first saved via the editor. */
  bioLongJson: TranslatableRichText | null;
  yearsOfExperience: number;
  availability: string;
  openTo: string[];
  email: string;
  phone: string | null;
  /** Public Zalo phone — surfaced on /contact as a VN-locale channel. */
  phoneZalo: string | null;
  preferredContactPlatform: string;
  preferredContactValue: string;
  locationCountry: string;
  locationCity: string;
  locationPostalCode: string | null;
  locationAddress1: string | null;
  locationAddress2: string | null;
  socialLinks: Array<{ platform: string; url: string; handle?: string }>;
  resumeUrls: ResumeUrls;
  certifications: Array<{ name: string; issuer: string; year: number; url?: string }>;
  metaTitle: string | null;
  metaDescription: string | null;
  timezones: string[];
  workingHours: { start: string; end: string } | null;
  canonicalUrl: string | null;
  avatarId: string | null;
  ogImageId: string | null;
  avatarUrl: string | null;
  ogImageUrl: string | null;
  // Landing content blocks
  tagline: TranslatableJson | null;
  stackIntro: TranslatableJson | null;
  selectedWorkIntro: TranslatableJson | null;
  contactIntro: TranslatableJson | null;
  footerTagline: TranslatableJson | null;
  /** /about narrative copy — page-shell hero + §04 Next steps. */
  aboutHeading: TranslatableJson | null;
  aboutLede: TranslatableJson | null;
  ctaHeading: TranslatableJson | null;
  ctaLede: TranslatableJson | null;
  coreStack: string[];
  /** ISO timestamp of the last `markContentUpdated` save. Null until first. */
  contentUpdatedAt: string | null;
}

// ── Per-section PATCH payloads (mirror BE Update*Schema shapes) ────────────

export interface UpdateIdentityPayload {
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;
  /** RTE bio document pair. Omitted when both locales are empty (identity-only update). */
  bioLongJson?: TranslatableRichText;
}

export interface UpdateWorkAvailabilityPayload {
  yearsOfExperience: number;
  availability: string;
  openTo: string[];
  timezones: string[];
  workingHours: { start: string; end: string } | null;
}

export interface UpdateContactPayload {
  email: string;
  phone: string | null;
  phoneZalo: string | null;
  preferredContactPlatform: string;
  preferredContactValue: string;
}

export interface UpdateLocationPayload {
  locationCountry: string;
  locationCity: string;
  locationPostalCode: string | null;
  locationAddress1: string | null;
  locationAddress2: string | null;
}

export interface UpdateSocialLinksPayload {
  socialLinks: Array<{ platform: string; url: string; handle?: string }>;
  resumeUrls: ResumeUrls;
  certifications: Array<{ name: string; issuer: string; year: number; url?: string }>;
}

export interface UpdateSeoOgPayload {
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
}

export interface UpdateLandingContentPayload {
  tagline: TranslatableJson | null;
  stackIntro: TranslatableJson | null;
  selectedWorkIntro: TranslatableJson | null;
  contactIntro: TranslatableJson | null;
  footerTagline: TranslatableJson | null;
  aboutHeading: TranslatableJson | null;
  aboutLede: TranslatableJson | null;
  ctaHeading: TranslatableJson | null;
  ctaLede: TranslatableJson | null;
  coreStack: string[];
}

export type SectionKey = (typeof PROFILE_SECTIONS)[number]['value'];
