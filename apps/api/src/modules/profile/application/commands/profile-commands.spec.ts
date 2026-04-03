import { UpsertProfileCommand, UpsertProfileHandler } from './upsert-profile.command';
import { UpdateAvatarCommand, UpdateAvatarHandler } from './update-avatar.command';
import { UpdateOgImageCommand, UpdateOgImageHandler } from './update-og-image.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { Profile } from '../../domain/entities/profile.entity';
import { IProfileProps } from '../../domain/profile.types';

describe('Profile Commands', () => {
  let profileRepo: jest.Mocked<IProfileRepository>;
  let mediaRepo: jest.Mocked<Pick<IMediaRepository, 'findById'>>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const profileId = '550e8400-e29b-41d4-a716-446655440001';
  const mediaId = '550e8400-e29b-41d4-a716-446655440002';

  const baseProps: IProfileProps = {
    id: profileId,
    userId,
    fullName: { en: 'John Doe', vi: 'Nguyen Van A' },
    title: { en: 'Developer', vi: 'Lap trinh vien' },
    bioShort: { en: 'A dev', vi: 'Mot dev' },
    bioLong: null,
    yearsOfExperience: 5,
    availability: 'EMPLOYED',
    openTo: [],
    email: 'john@example.com',
    phone: null,
    preferredContactPlatform: 'LINKEDIN',
    preferredContactValue: 'linkedin.com/in/john',
    locationCountry: 'Vietnam',
    locationCity: 'HCMC',
    locationPostalCode: null,
    locationAddress1: null,
    locationAddress2: null,
    socialLinks: [],
    resumeUrls: {},
    certifications: [],
    metaTitle: null,
    metaDescription: null,
    ogImageId: null,
    timezone: null,
    canonicalUrl: null,
    avatarId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
  };

  const validUpsertDto = {
    fullName: { en: 'John Doe', vi: 'Nguyen Van A' },
    title: { en: 'Developer', vi: 'Lap trinh vien' },
    bioShort: { en: 'A dev', vi: 'Mot dev' },
    bioLong: null,
    yearsOfExperience: 5,
    availability: 'EMPLOYED',
    openTo: [],
    email: 'john@example.com',
    preferredContactPlatform: 'LINKEDIN',
    preferredContactValue: 'linkedin.com/in/john',
    locationCountry: 'Vietnam',
    locationCity: 'HCMC',
    socialLinks: [],
    resumeUrls: {},
    certifications: [],
  };

  const loadProfile = (overrides: Partial<IProfileProps> = {}) => Profile.load({ ...baseProps, ...overrides });

  beforeEach(() => {
    profileRepo = {
      findByUserId: jest.fn(),
      findOwnerProfile: jest.fn(),
      findWithMedia: jest.fn(),
      upsert: jest.fn().mockResolvedValue(profileId),
      updateAvatar: jest.fn(),
      updateOgImage: jest.fn(),
    };
    mediaRepo = {
      findById: jest.fn(),
    };
  });

  // --- Upsert Profile ---

  describe('UpsertProfileHandler', () => {
    let handler: UpsertProfileHandler;
    beforeEach(() => (handler = new UpsertProfileHandler(profileRepo, mediaRepo as unknown as IMediaRepository)));

    it('should create new profile when none exists', async () => {
      profileRepo.findByUserId.mockResolvedValue(null);

      const result = await handler.execute(new UpsertProfileCommand(validUpsertDto, userId));

      expect(result).toEqual({ id: profileId });
      expect(profileRepo.upsert).toHaveBeenCalled();
    });

    it('should update existing profile', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      const result = await handler.execute(
        new UpsertProfileCommand({ ...validUpsertDto, yearsOfExperience: 10 }, userId)
      );

      expect(result).toEqual({ id: profileId });
      expect(profileRepo.upsert).toHaveBeenCalled();
    });

    it('should reject invalid input', async () => {
      await expect(handler.execute(new UpsertProfileCommand({}, userId))).rejects.toMatchObject({
        statusCode: 400,
        errorCode: 'PROFILE_INVALID_INPUT',
      });
    });

    it('should reject missing required translatable fields', async () => {
      await expect(
        handler.execute(new UpsertProfileCommand({ ...validUpsertDto, fullName: { en: '' } }, userId))
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should reject invalid socialLinks', async () => {
      await expect(
        handler.execute(new UpsertProfileCommand({ ...validUpsertDto, socialLinks: [{ bad: 'data' }] }, userId))
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should reject invalid certifications', async () => {
      await expect(
        handler.execute(
          new UpsertProfileCommand({ ...validUpsertDto, certifications: [{ missing: 'fields' }] }, userId)
        )
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw MEDIA_NOT_FOUND when avatarId references nonexistent media', async () => {
      profileRepo.findByUserId.mockResolvedValue(null);
      mediaRepo.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new UpsertProfileCommand({ ...validUpsertDto, avatarId: mediaId }, userId))
      ).rejects.toMatchObject({ statusCode: 404, errorCode: 'PROFILE_MEDIA_NOT_FOUND' });
    });

    it('should reject avatarId: null (use UpdateAvatarCommand to clear avatar)', async () => {
      // UpsertProfileSchema uses z.uuid().optional() — null is rejected intentionally.
      // To clear an avatar, callers must use UpdateAvatarCommand which uses z.uuid().nullable().
      await expect(
        handler.execute(new UpsertProfileCommand({ ...validUpsertDto, avatarId: null }, userId))
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('should throw MEDIA_NOT_FOUND when ogImageId references nonexistent media', async () => {
      profileRepo.findByUserId.mockResolvedValue(null);
      mediaRepo.findById.mockResolvedValue(null);

      await expect(
        handler.execute(new UpsertProfileCommand({ ...validUpsertDto, ogImageId: mediaId }, userId))
      ).rejects.toMatchObject({ statusCode: 404, errorCode: 'PROFILE_MEDIA_NOT_FOUND' });
    });
  });

  // --- Update Avatar ---

  describe('UpdateAvatarHandler', () => {
    let handler: UpdateAvatarHandler;
    beforeEach(() => (handler = new UpdateAvatarHandler(profileRepo, mediaRepo as unknown as IMediaRepository)));

    it('should update avatar with valid media', async () => {
      mediaRepo.findById.mockResolvedValue({} as any);

      await handler.execute(new UpdateAvatarCommand({ avatarId: mediaId }, userId));

      expect(profileRepo.updateAvatar).toHaveBeenCalledWith(userId, mediaId);
    });

    it('should remove avatar when null', async () => {
      await handler.execute(new UpdateAvatarCommand({ avatarId: null }, userId));

      expect(profileRepo.updateAvatar).toHaveBeenCalledWith(userId, null);
    });

    it('should throw MEDIA_NOT_FOUND for nonexistent media', async () => {
      mediaRepo.findById.mockResolvedValue(null);

      await expect(handler.execute(new UpdateAvatarCommand({ avatarId: mediaId }, userId))).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'PROFILE_MEDIA_NOT_FOUND',
      });
    });
  });

  // --- Update OG Image ---

  describe('UpdateOgImageHandler', () => {
    let handler: UpdateOgImageHandler;
    beforeEach(() => (handler = new UpdateOgImageHandler(profileRepo, mediaRepo as unknown as IMediaRepository)));

    it('should update ogImage with valid media', async () => {
      mediaRepo.findById.mockResolvedValue({} as any);

      await handler.execute(new UpdateOgImageCommand({ ogImageId: mediaId }, userId));

      expect(profileRepo.updateOgImage).toHaveBeenCalledWith(userId, mediaId);
    });

    it('should remove ogImage when null', async () => {
      await handler.execute(new UpdateOgImageCommand({ ogImageId: null }, userId));

      expect(profileRepo.updateOgImage).toHaveBeenCalledWith(userId, null);
    });

    it('should throw MEDIA_NOT_FOUND for nonexistent media', async () => {
      mediaRepo.findById.mockResolvedValue(null);

      await expect(handler.execute(new UpdateOgImageCommand({ ogImageId: mediaId }, userId))).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'PROFILE_MEDIA_NOT_FOUND',
      });
    });
  });
});
