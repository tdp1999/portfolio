import type {
  TranslatableJson,
  SocialLink,
  Certification,
  ResumeUrls,
  OpenToValue,
  SocialPlatform,
} from '@portfolio/shared/types';

export type ProfileAvailability = 'OPEN_TO_WORK' | 'EMPLOYED' | 'FREELANCING' | 'NOT_AVAILABLE';

export interface WorkingHours {
  start: string;
  end: string;
}

export type PublicProfileResponse = {
  fullName: TranslatableJson;
  title: TranslatableJson;
  bioShort: TranslatableJson;
  bioLong: TranslatableJson | null;
  yearsOfExperience: number;
  availability: ProfileAvailability;
  openTo: OpenToValue[];
  email: string;
  /** Public Zalo phone — surfaced on /contact as a VN-locale channel. Null when not set. */
  phoneZalo: string | null;
  preferredContactPlatform: SocialPlatform;
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
  workingHours: WorkingHours | null;
  canonicalUrl: string | null;
  tagline: TranslatableJson | null;
  stackIntro: TranslatableJson | null;
  selectedWorkIntro: TranslatableJson | null;
  contactIntro: TranslatableJson | null;
  footerTagline: TranslatableJson | null;
  coreStack: string[];
};

export type ProfileJsonLd = {
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
