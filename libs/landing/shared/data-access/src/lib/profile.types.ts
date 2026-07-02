import type {
  TranslatableJson,
  TranslatableRichText,
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
  /** Raw Tiptap editor document per locale — re-edit source (console). Not read on landing. */
  bioLongJson: TranslatableRichText | null;
  /** Sanitized HTML cache per locale — RSS / llms.txt / no-JS fallback only. */
  bioLongHtml: TranslatableJson | null;
  bioLongSchemaVersion: number;
  /** Canonical `PortableDocument` per locale (ADR-023) — the story's AST read-path
   *  source. `home-intro` projects it to per-paragraph runs (`paragraphsFromDoc`). */
  bioLongCanonical: TranslatableJson | null;
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
  /** /about page-shell hero heading + lede. Plain text per locale. */
  aboutHeading: TranslatableJson | null;
  aboutLede: TranslatableJson | null;
  /** /about §04 Next steps heading + lede. Plain text per locale. */
  ctaHeading: TranslatableJson | null;
  ctaLede: TranslatableJson | null;
  coreStack: string[];
  /** ISO timestamp of the author's last narrative-copy save (drives the
   *  /about hero "Last updated" line). Null until the first save. */
  contentUpdatedAt: string | null;
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
