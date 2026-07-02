import type { TranslatableJson, TranslatableRichText } from '@portfolio/shared/types';
import { Profile } from '../../domain/entities/profile.entity';
import {
  Identity,
  WorkAvailability,
  Contact,
  Location,
  SocialLinks,
  SeoOg,
  LandingContentBlocks,
} from '../../domain/value-objects';

export interface ProfileWithMedia {
  profile: Profile;
  avatarUrl: string | null;
  ogImageUrl: string | null;
}

/** Canonical rich-text triple for the `bioLong` group — the versioned JSON source,
 *  its sanitized HTML cache, and the schema version, produced by `RichTextService`. */
export interface ProfileBioLongRichText {
  json: TranslatableRichText;
  canonical: TranslatableJson;
  html: TranslatableJson;
  schemaVersion: number;
}

export type IProfileRepository = {
  findByUserId(userId: string): Promise<Profile | null>;
  findOwnerProfile(): Promise<ProfileWithMedia | null>;
  findWithMedia(userId: string): Promise<ProfileWithMedia | null>;

  updateAvatar(userId: string, avatarId: string | null): Promise<void>;
  updateOgImage(userId: string, ogImageId: string | null): Promise<void>;
  /** Persists identity and — when the bilingual editor document was sent — the
   *  canonical `bioLong` rich-text triple in a single atomic write (same row), so
   *  identity and rich text can never commit partially. */
  updateIdentity(
    userId: string,
    identity: Identity,
    updatedById: string,
    bioLongRichText?: ProfileBioLongRichText | null
  ): Promise<void>;
  updateWorkAvailability(userId: string, workAvailability: WorkAvailability, updatedById: string): Promise<void>;
  updateContact(userId: string, contact: Contact, updatedById: string): Promise<void>;
  updateLocation(userId: string, location: Location, updatedById: string): Promise<void>;
  updateSocialLinks(userId: string, socialLinks: SocialLinks, updatedById: string): Promise<void>;
  updateSeoOg(userId: string, seoOg: SeoOg, updatedById: string): Promise<void>;
  updateLandingContent(userId: string, landingContent: LandingContentBlocks, updatedById: string): Promise<void>;
  markContentUpdated(userId: string, contentUpdatedAt: Date, updatedById: string): Promise<void>;
};
