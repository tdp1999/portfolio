import { Profile } from '../../domain/entities/profile.entity';
import { Identity, WorkAvailability, Contact, Location, SocialLinks, SeoOg } from '../../domain/value-objects';

export interface ProfileWithMedia {
  profile: Profile;
  avatarUrl: string | null;
  ogImageUrl: string | null;
}

export type IProfileRepository = {
  findByUserId(userId: string): Promise<Profile | null>;
  findOwnerProfile(): Promise<ProfileWithMedia | null>;
  findWithMedia(userId: string): Promise<ProfileWithMedia | null>;

  updateAvatar(userId: string, avatarId: string | null): Promise<void>;
  updateOgImage(userId: string, ogImageId: string | null): Promise<void>;
  updateIdentity(userId: string, identity: Identity, updatedById: string): Promise<void>;
  updateWorkAvailability(userId: string, workAvailability: WorkAvailability, updatedById: string): Promise<void>;
  updateContact(userId: string, contact: Contact, updatedById: string): Promise<void>;
  updateLocation(userId: string, location: Location, updatedById: string): Promise<void>;
  updateSocialLinks(userId: string, socialLinks: SocialLinks, updatedById: string): Promise<void>;
  updateSeoOg(userId: string, seoOg: SeoOg, updatedById: string): Promise<void>;
};
