import { z } from 'zod/v4';
import type {
  TranslatableJson,
  SocialLink,
  Certification,
  ResumeUrls,
  OpenToValue,
  SocialPlatform as SocialPlatformType,
} from '@portfolio/shared/types';
import type { Availability as AvailabilityType, WorkingHoursValue } from '../domain/profile.types';

// --- Update Avatar / OG Image Schemas ---

export const UpdateAvatarSchema = z.object({
  avatarId: z.uuid().nullable(),
});

export const UpdateOgImageSchema = z.object({
  ogImageId: z.uuid().nullable(),
});

export type UpdateAvatarDto = z.infer<typeof UpdateAvatarSchema>;
export type UpdateOgImageDto = z.infer<typeof UpdateOgImageSchema>;

// --- Response DTOs ---

export type ProfilePublicResponseDto = {
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;
  bioLong: TranslatableJson | null;
  yearsOfExperience: number;
  availability: AvailabilityType;
  openTo: OpenToValue[];
  email: string;
  /** Public Zalo phone number — surfaced as a contact channel on `/contact` (VN locale). */
  phoneZalo: string | null;
  preferredContactPlatform: SocialPlatformType;
  preferredContactValue: string;
  locationCountry: string;
  locationCity: string;
  socialLinks: SocialLink[];
  resumeUrls: ResumeUrls;
  certifications: Certification[];
  avatarUrl: string | null;
  ogImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  timezones: string[];
  workingHours: WorkingHoursValue | null;
  canonicalUrl: string | null;
  // Landing content blocks
  tagline: TranslatableJson | null;
  stackIntro: TranslatableJson | null;
  selectedWorkIntro: TranslatableJson | null;
  contactIntro: TranslatableJson | null;
  footerTagline: TranslatableJson | null;
  /** /about narrative copy — bilingual plain text. */
  aboutHeading: TranslatableJson | null;
  aboutLede: TranslatableJson | null;
  ctaHeading: TranslatableJson | null;
  ctaLede: TranslatableJson | null;
  coreStack: string[];
  /** ISO timestamp of the author's last `markContentUpdated` action. Null until
   *  the first save. Drives the /about hero "Last updated" line. */
  contentUpdatedAt: string | null;
};

export type ProfileAdminResponseDto = ProfilePublicResponseDto & {
  id: string;
  userId: string;
  phone: string | null;
  locationPostalCode: string | null;
  locationAddress1: string | null;
  locationAddress2: string | null;
  avatarId: string | null;
  ogImageId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
};

export type ProfileJsonLdDto = {
  '@context': 'https://schema.org';
  '@type': 'Person';
  name: string;
  jobTitle: string;
  description: string;
  image: string | null;
  email: string;
  url: string | null;
  address: {
    '@type': 'PostalAddress';
    addressLocality: string;
    addressCountry: string;
  };
  sameAs: string[];
  knowsLanguage: string[];
};
