import { IBaseAuditProps } from '@portfolio/shared/types';
import type {
  TranslatableJson,
  SocialLink,
  Certification,
  ResumeUrls,
  OpenToValue,
  SocialPlatform,
} from '@portfolio/shared/types';

export type Availability = 'OPEN_TO_WORK' | 'EMPLOYED' | 'FREELANCING' | 'NOT_AVAILABLE';

export interface IProfileProps extends Omit<IBaseAuditProps, 'deletedAt' | 'deletedById'> {
  userId: string;

  // Translatable
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;
  bioLong: TranslatableJson | null;

  // Work
  yearsOfExperience: number;
  availability: Availability;
  openTo: OpenToValue[];

  // Contact
  email: string;
  phone: string | null;
  preferredContactPlatform: SocialPlatform;
  preferredContactValue: string;

  // Location
  locationCountry: string;
  locationCity: string;
  locationPostalCode: string | null;
  locationAddress1: string | null;
  locationAddress2: string | null;

  // Social/Resume
  socialLinks: SocialLink[];
  resumeUrls: ResumeUrls;

  // Certifications
  certifications: Certification[];

  // SEO
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageId: string | null;

  // Misc
  timezone: string | null;
  canonicalUrl: string | null;

  // Media
  avatarId: string | null;
}

export interface ICreateProfilePayload {
  userId: string;

  // Translatable (required)
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;
  bioLong?: TranslatableJson;

  // Work
  yearsOfExperience: number;
  availability?: Availability;
  openTo?: OpenToValue[];

  // Contact
  email: string;
  phone?: string;
  preferredContactPlatform?: SocialPlatform;
  preferredContactValue: string;

  // Location
  locationCountry: string;
  locationCity: string;
  locationPostalCode?: string;
  locationAddress1?: string;
  locationAddress2?: string;

  // Social/Resume
  socialLinks?: SocialLink[];
  resumeUrls?: ResumeUrls;

  // Certifications
  certifications?: Certification[];

  // SEO
  metaTitle?: string;
  metaDescription?: string;
  ogImageId?: string;

  // Misc
  timezone?: string;
  canonicalUrl?: string;

  // Media
  avatarId?: string;
}
