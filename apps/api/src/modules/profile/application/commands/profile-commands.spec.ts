import { UpdateAvatarCommand, UpdateAvatarHandler } from './update-avatar.command';
import { UpdateOgImageCommand, UpdateOgImageHandler } from './update-og-image.command';
import { UpdateProfileIdentityCommand, UpdateProfileIdentityHandler } from './update-profile-identity.command';
import {
  UpdateProfileWorkAvailabilityCommand,
  UpdateProfileWorkAvailabilityHandler,
} from './update-profile-work-availability.command';
import { UpdateProfileContactCommand, UpdateProfileContactHandler } from './update-profile-contact.command';
import { UpdateProfileLocationCommand, UpdateProfileLocationHandler } from './update-profile-location.command';
import {
  UpdateProfileSocialLinksCommand,
  UpdateProfileSocialLinksHandler,
} from './update-profile-social-links.command';
import { UpdateProfileSeoOgCommand, UpdateProfileSeoOgHandler } from './update-profile-seo-og.command';
import {
  UpdateProfileLandingContentCommand,
  UpdateProfileLandingContentHandler,
} from './update-profile-landing-content.command';
import {
  MarkProfileContentUpdatedCommand,
  MarkProfileContentUpdatedHandler,
} from './mark-profile-content-updated.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { IMediaRepository } from '../../../media/application/ports/media.repository.port';
import { Profile } from '../../domain/entities/profile.entity';
import { IProfileProps } from '../../domain/profile.types';
import type { RichTextService } from '../../../shared/rich-text';
import type { EditorDocument } from '@portfolio/shared/features/rte-core';

// UpdateProfileIdentityHandler imports RichTextService, which pulls in the ESM-only
// document-engine-core and the jsdom-backed sanitizer. Mock the service module so
// this suite never loads that tree; the identity tests inject their own stub.
jest.mock('../../../shared/rich-text/rich-text.service', () => ({
  RichTextService: class {
    toCanonicalForm = jest.fn();
    toCanonicalFormTranslatable = jest.fn();
  },
}));

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
    bioLongJson: null,
    bioLongHtml: null,
    bioLongSchemaVersion: 1,
    yearsOfExperience: 5,
    availability: 'EMPLOYED',
    openTo: [],
    email: 'john@example.com',
    phone: null,
    phoneZalo: null,
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
    timezones: [],
    workingHours: null,
    canonicalUrl: null,
    avatarId: null,
    tagline: null,
    stackIntro: null,
    selectedWorkIntro: null,
    contactIntro: null,
    footerTagline: null,
    aboutHeading: null,
    aboutLede: null,
    ctaHeading: null,
    ctaLede: null,
    coreStack: [],
    contentUpdatedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
  };

  const loadProfile = (overrides: Partial<IProfileProps> = {}) => Profile.load({ ...baseProps, ...overrides });

  beforeEach(() => {
    profileRepo = {
      findByUserId: jest.fn(),
      findOwnerProfile: jest.fn(),
      findWithMedia: jest.fn(),

      updateAvatar: jest.fn(),
      updateOgImage: jest.fn(),
      updateIdentity: jest.fn(),
      updateWorkAvailability: jest.fn(),
      updateContact: jest.fn(),
      updateLocation: jest.fn(),
      updateSocialLinks: jest.fn(),
      updateSeoOg: jest.fn(),
      updateLandingContent: jest.fn(),
      markContentUpdated: jest.fn(),
    };
    mediaRepo = {
      findById: jest.fn(),
    };
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

  // --- Update Profile Identity ---

  describe('UpdateProfileIdentityHandler', () => {
    let handler: UpdateProfileIdentityHandler;
    let richText: { toCanonicalForm: jest.Mock; toCanonicalFormTranslatable: jest.Mock };
    beforeEach(() => {
      richText = { toCanonicalForm: jest.fn(), toCanonicalFormTranslatable: jest.fn() };
      handler = new UpdateProfileIdentityHandler(profileRepo, richText as unknown as RichTextService);
    });

    const richDoc = (text: string): EditorDocument => ({
      schemaVersion: 1,
      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text }] }] },
    });

    const validDto = {
      fullName: { en: 'Jane Doe', vi: 'Tran Thi B' },
      title: { en: 'Designer', vi: 'Nha thiet ke' },
      bioShort: { en: 'Short bio', vi: 'Tieu su' },
      bioLong: null,
    };

    it('should update identity when valid', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(new UpdateProfileIdentityCommand(validDto, userId));

      // no bioLongJson → identity-only write, rich-text arg is null
      expect(profileRepo.updateIdentity).toHaveBeenCalledWith(userId, expect.anything(), userId, null);
    });

    // Shared NOT_FOUND branch — tested once here, same logic in all 6 section handlers.
    it('should throw NOT_FOUND when profile missing', async () => {
      profileRepo.findByUserId.mockResolvedValue(null);

      await expect(handler.execute(new UpdateProfileIdentityCommand(validDto, userId))).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'PROFILE_NOT_FOUND',
      });
    });

    it('should throw INVALID_INPUT when dto is invalid', async () => {
      await expect(handler.execute(new UpdateProfileIdentityCommand({}, userId))).rejects.toMatchObject({
        errorCode: 'PROFILE_INVALID_INPUT',
      });
      expect(profileRepo.findByUserId).not.toHaveBeenCalled();
    });

    it('does not touch the rich-text path when bioLongJson is absent', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(new UpdateProfileIdentityCommand(validDto, userId));

      expect(richText.toCanonicalFormTranslatable).not.toHaveBeenCalled();
      expect(profileRepo.updateIdentity).toHaveBeenCalledWith(userId, expect.anything(), userId, null);
    });

    it('canonicalizes bioLongJson and persists the 3-value group atomically when present', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());
      const triple = {
        json: { en: richDoc('hi'), vi: richDoc('chao') },
        html: { en: '<p>hi</p>', vi: '<p>chao</p>' },
        schemaVersion: 1,
      };
      richText.toCanonicalFormTranslatable.mockResolvedValue(triple);
      const bioLongJson = { en: richDoc('hi'), vi: richDoc('chao') };

      await handler.execute(new UpdateProfileIdentityCommand({ ...validDto, bioLongJson }, userId));

      expect(richText.toCanonicalFormTranslatable).toHaveBeenCalledWith(bioLongJson, 'profile.bioLong');
      // identity + rich-text triple persist in a SINGLE atomic write (one call, 4th arg)
      expect(profileRepo.updateIdentity).toHaveBeenCalledTimes(1);
      expect(profileRepo.updateIdentity).toHaveBeenCalledWith(userId, expect.anything(), userId, triple);
    });
  });

  // --- Update Profile Work Availability ---

  describe('UpdateProfileWorkAvailabilityHandler', () => {
    let handler: UpdateProfileWorkAvailabilityHandler;
    beforeEach(() => (handler = new UpdateProfileWorkAvailabilityHandler(profileRepo)));

    const validDto = {
      yearsOfExperience: 8,
      availability: 'OPEN_TO_WORK',
      openTo: ['FULL_TIME'],
      timezones: ['Asia/Ho_Chi_Minh'],
    };

    it('should update work availability when valid', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(new UpdateProfileWorkAvailabilityCommand(validDto, userId));

      expect(profileRepo.updateWorkAvailability).toHaveBeenCalledWith(userId, expect.anything(), userId);
    });

    it('should throw INVALID_INPUT when dto is invalid', async () => {
      await expect(handler.execute(new UpdateProfileWorkAvailabilityCommand({}, userId))).rejects.toMatchObject({
        errorCode: 'PROFILE_INVALID_INPUT',
      });
      expect(profileRepo.findByUserId).not.toHaveBeenCalled();
    });
  });

  // --- Update Profile Contact ---

  describe('UpdateProfileContactHandler', () => {
    let handler: UpdateProfileContactHandler;
    beforeEach(() => (handler = new UpdateProfileContactHandler(profileRepo)));

    const validDto = {
      email: 'jane@example.com',
      phone: null,
      phoneZalo: null,
      preferredContactPlatform: 'LINKEDIN',
      preferredContactValue: 'linkedin.com/in/jane',
    };

    it('should update contact when valid', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(new UpdateProfileContactCommand(validDto, userId));

      expect(profileRepo.updateContact).toHaveBeenCalledWith(userId, expect.anything(), userId);
    });

    it('should throw INVALID_INPUT when dto is invalid', async () => {
      await expect(handler.execute(new UpdateProfileContactCommand({}, userId))).rejects.toMatchObject({
        errorCode: 'PROFILE_INVALID_INPUT',
      });
      expect(profileRepo.findByUserId).not.toHaveBeenCalled();
    });
  });

  // --- Update Profile Location ---

  describe('UpdateProfileLocationHandler', () => {
    let handler: UpdateProfileLocationHandler;
    beforeEach(() => (handler = new UpdateProfileLocationHandler(profileRepo)));

    const validDto = {
      locationCountry: 'Vietnam',
      locationCity: 'Hanoi',
      locationPostalCode: null,
      locationAddress1: null,
      locationAddress2: null,
    };

    it('should update location when valid', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(new UpdateProfileLocationCommand(validDto, userId));

      expect(profileRepo.updateLocation).toHaveBeenCalledWith(userId, expect.anything(), userId);
    });

    it('should throw INVALID_INPUT when dto is invalid', async () => {
      await expect(handler.execute(new UpdateProfileLocationCommand({}, userId))).rejects.toMatchObject({
        errorCode: 'PROFILE_INVALID_INPUT',
      });
      expect(profileRepo.findByUserId).not.toHaveBeenCalled();
    });
  });

  // --- Update Profile Social Links ---

  describe('UpdateProfileSocialLinksHandler', () => {
    let handler: UpdateProfileSocialLinksHandler;
    beforeEach(() => (handler = new UpdateProfileSocialLinksHandler(profileRepo)));

    const validDto = {
      socialLinks: [{ platform: 'GITHUB', url: 'https://github.com/user' }],
      resumeUrls: {},
      certifications: [],
    };

    it('should update social links when valid', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(new UpdateProfileSocialLinksCommand(validDto, userId));

      expect(profileRepo.updateSocialLinks).toHaveBeenCalledWith(userId, expect.anything(), userId);
    });

    it('should throw INVALID_INPUT when dto is invalid', async () => {
      // socialLinks entry with missing url/platform fails schema
      await expect(
        handler.execute(new UpdateProfileSocialLinksCommand({ socialLinks: [{}] }, userId))
      ).rejects.toMatchObject({ errorCode: 'PROFILE_INVALID_INPUT' });
      expect(profileRepo.findByUserId).not.toHaveBeenCalled();
    });
  });

  // --- Update Profile SEO/OG ---

  describe('UpdateProfileSeoOgHandler', () => {
    let handler: UpdateProfileSeoOgHandler;
    beforeEach(() => (handler = new UpdateProfileSeoOgHandler(profileRepo)));

    const validDto = {
      metaTitle: 'My Portfolio',
      metaDescription: 'A short description',
      canonicalUrl: 'https://example.com',
    };

    it('should update SEO/OG when valid', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(new UpdateProfileSeoOgCommand(validDto, userId));

      expect(profileRepo.updateSeoOg).toHaveBeenCalledWith(userId, expect.anything(), userId);
    });

    it('should coerce empty strings to null and accept the payload', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(
        new UpdateProfileSeoOgCommand({ metaTitle: '', metaDescription: '', canonicalUrl: '' }, userId)
      );

      expect(profileRepo.updateSeoOg).toHaveBeenCalledWith(userId, expect.anything(), userId);
    });

    it('should throw INVALID_INPUT when canonicalUrl is not a URL', async () => {
      await expect(
        handler.execute(
          new UpdateProfileSeoOgCommand({ metaTitle: null, metaDescription: null, canonicalUrl: 'not-a-url' }, userId)
        )
      ).rejects.toMatchObject({ errorCode: 'PROFILE_INVALID_INPUT' });
      expect(profileRepo.findByUserId).not.toHaveBeenCalled();
    });
  });

  // --- Update Profile Landing Content ---

  describe('UpdateProfileLandingContentHandler', () => {
    let handler: UpdateProfileLandingContentHandler;
    beforeEach(() => (handler = new UpdateProfileLandingContentHandler(profileRepo)));

    const validDto = {
      tagline: { en: 'Build delightful UIs', vi: 'Xay dung giao dien thu vi' },
      stackIntro: null,
      selectedWorkIntro: null,
      contactIntro: null,
      footerTagline: null,
      aboutHeading: { en: 'About', vi: 'Ve toi' },
      aboutLede: null,
      ctaHeading: null,
      ctaLede: null,
      coreStack: [],
    };

    it('should update landing content when valid', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(new UpdateProfileLandingContentCommand(validDto, userId));

      expect(profileRepo.updateLandingContent).toHaveBeenCalledWith(userId, expect.anything(), userId);
    });

    it('should accept all-null payload (clears every block)', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(
        new UpdateProfileLandingContentCommand(
          {
            tagline: null,
            stackIntro: null,
            selectedWorkIntro: null,
            contactIntro: null,
            footerTagline: null,
            aboutHeading: null,
            aboutLede: null,
            ctaHeading: null,
            ctaLede: null,
            coreStack: [],
          },
          userId
        )
      );

      expect(profileRepo.updateLandingContent).toHaveBeenCalledWith(userId, expect.anything(), userId);
    });

    it('should throw INVALID_INPUT when dto is invalid', async () => {
      await expect(
        handler.execute(new UpdateProfileLandingContentCommand({ tagline: 'not-an-object' }, userId))
      ).rejects.toMatchObject({ errorCode: 'PROFILE_INVALID_INPUT' });
      expect(profileRepo.findByUserId).not.toHaveBeenCalled();
    });

    it('should persist the new /about copy fields through the VO', async () => {
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      await handler.execute(
        new UpdateProfileLandingContentCommand(
          {
            tagline: null,
            stackIntro: null,
            selectedWorkIntro: null,
            contactIntro: null,
            footerTagline: null,
            aboutHeading: { en: 'About — engineering for hiring teams', vi: 'Ve toi' },
            aboutLede: { en: 'Six years shipping.', vi: 'Sau nam ship.' },
            ctaHeading: { en: 'Door is open', vi: 'Cua mo' },
            ctaLede: { en: 'Pick the door that fits.', vi: 'Chon cua phu hop.' },
            coreStack: [],
          },
          userId
        )
      );

      const vo = profileRepo.updateLandingContent.mock.calls[0][1];
      expect(vo.aboutHeading).toEqual({ en: 'About — engineering for hiring teams', vi: 'Ve toi' });
      expect(vo.aboutLede).toEqual({ en: 'Six years shipping.', vi: 'Sau nam ship.' });
      expect(vo.ctaHeading).toEqual({ en: 'Door is open', vi: 'Cua mo' });
      expect(vo.ctaLede).toEqual({ en: 'Pick the door that fits.', vi: 'Chon cua phu hop.' });
    });
  });

  // --- Mark Profile Content Updated ---

  describe('MarkProfileContentUpdatedHandler', () => {
    let handler: MarkProfileContentUpdatedHandler;
    beforeEach(() => (handler = new MarkProfileContentUpdatedHandler(profileRepo)));

    it('should stamp contentUpdatedAt via the repo and return the ISO string', async () => {
      const before = Date.now();
      profileRepo.findByUserId.mockResolvedValue(loadProfile());

      const result = await handler.execute(new MarkProfileContentUpdatedCommand(userId));

      expect(profileRepo.markContentUpdated).toHaveBeenCalledTimes(1);
      const [persistedUserId, persistedStamp, persistedEditor] = profileRepo.markContentUpdated.mock.calls[0];
      expect(persistedUserId).toBe(userId);
      expect(persistedEditor).toBe(userId);
      expect(persistedStamp.getTime()).toBeGreaterThanOrEqual(before);
      // Returned ISO string round-trips to the same instant the repo received.
      expect(new Date(result.contentUpdatedAt).getTime()).toBe(persistedStamp.getTime());
    });

    it('should throw NOT_FOUND when profile is missing', async () => {
      profileRepo.findByUserId.mockResolvedValue(null);

      await expect(handler.execute(new MarkProfileContentUpdatedCommand(userId))).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'PROFILE_NOT_FOUND',
      });
      expect(profileRepo.markContentUpdated).not.toHaveBeenCalled();
    });
  });
});
