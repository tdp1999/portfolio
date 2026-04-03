export interface ProfileAdminResponse {
  id: string;
  userId: string;
  fullName: { en: string; vi: string };
  title: { en: string; vi: string };
  bioShort: { en: string; vi: string };
  bioLong: { en?: string; vi?: string } | null;
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
  resumeUrls: { en?: string; vi?: string };
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

export interface UpsertProfilePayload {
  fullName: { en: string; vi: string };
  title: { en: string; vi: string };
  bioShort: { en: string; vi: string };
  bioLong?: { en?: string; vi?: string };
  yearsOfExperience: number;
  availability: string;
  openTo: string[];
  email: string;
  phone?: string;
  preferredContactPlatform: string;
  preferredContactValue: string;
  locationCountry: string;
  locationCity: string;
  locationPostalCode?: string;
  locationAddress1?: string;
  locationAddress2?: string;
  socialLinks: Array<{ platform: string; url: string; handle?: string }>;
  resumeUrls: { en?: string; vi?: string };
  certifications: Array<{ name: string; issuer: string; year: number; url?: string }>;
  metaTitle?: string;
  metaDescription?: string;
  timezone?: string;
  canonicalUrl?: string;
  avatarId?: string;
  ogImageId?: string;
}
