import { z } from 'zod/v4';
import type {
  TranslatableJson,
  SocialLink,
  Certification,
  ResumeUrls,
  OpenToValue,
  SocialPlatform as SocialPlatformType,
} from '@portfolio/shared/types';
import type { Availability as AvailabilityType } from '../domain/profile.types';

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
  timezone: string | null;
  canonicalUrl: string | null;
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
