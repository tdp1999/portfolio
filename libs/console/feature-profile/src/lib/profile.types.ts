import { OptionalTranslatableJson, ResumeUrls, TranslatableJson } from '@portfolio/shared/types';
import { PROFILE_SECTIONS } from './profile.data';

// ── Full admin profile response (GET /admin/profile) ───────────────────────
export interface ProfileAdminResponse {
  id: string;
  userId: string;
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;
  bioLong: OptionalTranslatableJson | null;
  yearsOfExperience: number;
  availability: string;
  openTo: string[];
  email: string;
  phone: string | null;
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
  timezone: string | null;
  canonicalUrl: string | null;
  avatarId: string | null;
  ogImageId: string | null;
  avatarUrl: string | null;
  ogImageUrl: string | null;
}

// ── Per-section PATCH payloads (mirror BE Update*Schema shapes) ────────────

export interface UpdateIdentityPayload {
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;
  bioLong: OptionalTranslatableJson | null;
}

export interface UpdateWorkAvailabilityPayload {
  yearsOfExperience: number;
  availability: string;
  openTo: string[];
  timezone: string | null;
}

export interface UpdateContactPayload {
  email: string;
  phone: string | null;
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

export type SectionKey = (typeof PROFILE_SECTIONS)[number]['value'];
