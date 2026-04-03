import { Profile } from '../../domain/entities/profile.entity';

export interface ProfileWithMedia {
  profile: Profile;
  avatarUrl: string | null;
  ogImageUrl: string | null;
}

export type IProfileRepository = {
  findByUserId(userId: string): Promise<Profile | null>;
  findOwnerProfile(): Promise<ProfileWithMedia | null>;
  findWithMedia(userId: string): Promise<ProfileWithMedia | null>;
  upsert(entity: Profile): Promise<string>;
  updateAvatar(userId: string, avatarId: string | null): Promise<void>;
  updateOgImage(userId: string, ogImageId: string | null): Promise<void>;
};
