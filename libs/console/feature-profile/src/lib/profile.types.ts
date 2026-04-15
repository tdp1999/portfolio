// ── Translatable value object shape (mirrors BE TranslatableJson) ──────────
export interface TranslatableValue {
  en: string;
  vi: string;
}

export interface OptionalTranslatableValue {
  en?: string;
  vi?: string;
}

// ── Full admin profile response (GET /admin/profile) ───────────────────────
export interface ProfileAdminResponse {
  id: string;
  userId: string;
  fullName: TranslatableValue;
  title: TranslatableValue;
  bioShort: TranslatableValue;
  bioLong: OptionalTranslatableValue | null;
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
  resumeUrls: OptionalTranslatableValue;
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
  fullName: TranslatableValue;
  title: TranslatableValue;
  bioShort: TranslatableValue;
  bioLong: OptionalTranslatableValue | null;
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
  resumeUrls: OptionalTranslatableValue;
  certifications: Array<{ name: string; issuer: string; year: number; url?: string }>;
}

export interface UpdateSeoOgPayload {
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
}
