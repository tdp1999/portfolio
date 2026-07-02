import { IBaseAuditProps } from '@portfolio/shared/types';
import type {
  TranslatableJson,
  TranslatableRichText,
  SocialLink,
  Certification,
  ResumeUrls,
  OpenToValue,
  SocialPlatform,
} from '@portfolio/shared/types';

export type Availability = 'OPEN_TO_WORK' | 'EMPLOYED' | 'FREELANCING' | 'NOT_AVAILABLE';

export interface WorkingHoursValue {
  start: string;
  end: string;
}

export interface IProfileProps extends Omit<IBaseAuditProps, 'deletedAt' | 'deletedById'> {
  userId: string;

  // Translatable
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;

  // Rich-text storage for the long bio (ADR-023). JSON canonical + sanitized
  // HTML cache + engine-agnostic canonical AST.
  bioLongJson: TranslatableRichText | null;
  bioLongHtml: TranslatableJson | null;
  bioLongSchemaVersion: number;
  // Canonical PortableDocument per locale (ADR-023) — AST read source.
  bioLongCanonical: TranslatableJson | null;

  // Work
  yearsOfExperience: number;
  availability: Availability;
  openTo: OpenToValue[];
  workingHours: WorkingHoursValue | null;

  // Contact
  email: string;
  phone: string | null;
  phoneZalo: string | null;
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

  // Landing content blocks (optional translatable copy)
  tagline: TranslatableJson | null;
  stackIntro: TranslatableJson | null;
  selectedWorkIntro: TranslatableJson | null;
  contactIntro: TranslatableJson | null;
  footerTagline: TranslatableJson | null;
  /** /about page-shell hero heading + lede; CTA heading + lede. Plain text. */
  aboutHeading: TranslatableJson | null;
  aboutLede: TranslatableJson | null;
  ctaHeading: TranslatableJson | null;
  ctaLede: TranslatableJson | null;
  coreStack: string[];

  // Misc
  timezones: string[];
  canonicalUrl: string | null;

  /** Last time the author bumped narrative content (separate from `updatedAt`
   *  which also bumps on avatar/social-link saves). Drives the /about hero
   *  "Last updated" line. Null until the first mark-content-updated call. */
  contentUpdatedAt: Date | null;

  // Media
  avatarId: string | null;
}

export interface ICreateProfilePayload {
  userId: string;

  // Translatable (required)
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;

  // Work
  yearsOfExperience: number;
  availability?: Availability;
  openTo?: OpenToValue[];
  workingHours?: WorkingHoursValue | null;

  // Contact
  email: string;
  phone?: string;
  phoneZalo?: string;
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

  // Landing content blocks (optional)
  tagline?: TranslatableJson;
  stackIntro?: TranslatableJson;
  selectedWorkIntro?: TranslatableJson;
  contactIntro?: TranslatableJson;
  footerTagline?: TranslatableJson;
  aboutHeading?: TranslatableJson;
  aboutLede?: TranslatableJson;
  ctaHeading?: TranslatableJson;
  ctaLede?: TranslatableJson;
  coreStack?: string[];

  // Misc
  timezones?: string[];
  canonicalUrl?: string;

  // Media
  avatarId?: string;
}
