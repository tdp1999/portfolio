import { GetProfileQuery, GetProfileHandler } from './get-profile.query';
import { GetPublicProfileQuery, GetPublicProfileHandler } from './get-public-profile.query';
import { GetJsonLdQuery, GetJsonLdHandler } from './get-json-ld.query';
import { IProfileRepository, ProfileWithMedia } from '../ports/profile.repository.port';
import { Profile } from '../../domain/entities/profile.entity';
import { IProfileProps } from '../../domain/profile.types';

describe('Profile Queries', () => {
  let repo: jest.Mocked<IProfileRepository>;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const profileId = '550e8400-e29b-41d4-a716-446655440001';

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
    phone: '+84123456789',
    preferredContactPlatform: 'LINKEDIN',
    preferredContactValue: 'linkedin.com/in/john',
    locationCountry: 'Vietnam',
    locationCity: 'HCMC',
    locationPostalCode: '70000',
    locationAddress1: '123 Street',
    locationAddress2: null,
    socialLinks: [{ platform: 'GITHUB', url: 'https://github.com/john' }],
    resumeUrls: {},
    certifications: [],
    metaTitle: 'John Doe',
    metaDescription: 'A developer',
    ogImageId: null,
    timezone: 'Asia/Ho_Chi_Minh',
    canonicalUrl: 'https://example.com',
    avatarId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
  };

  const profileWithMedia: ProfileWithMedia = {
    profile: Profile.load(baseProps),
    avatarUrl: 'https://cdn.example.com/avatar.jpg',
    ogImageUrl: null,
  };

  beforeEach(() => {
    repo = {
      findByUserId: jest.fn(),
      findOwnerProfile: jest.fn(),
      findWithMedia: jest.fn(),
      upsert: jest.fn(),
      updateAvatar: jest.fn(),
      updateOgImage: jest.fn(),
    };
  });

  // --- GetProfile (Admin) ---

  describe('GetProfileHandler', () => {
    let handler: GetProfileHandler;
    beforeEach(() => (handler = new GetProfileHandler(repo)));

    it('should return full admin response', async () => {
      repo.findWithMedia.mockResolvedValue(profileWithMedia);

      const result = await handler.execute(new GetProfileQuery(userId));

      expect(result.id).toBe(profileId);
      expect(result.userId).toBe(userId);
      expect(result.phone).toBe('+84123456789');
      expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it('should throw NotFound when profile does not exist', async () => {
      repo.findWithMedia.mockResolvedValue(null);

      await expect(handler.execute(new GetProfileQuery(userId))).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'PROFILE_NOT_FOUND',
      });
    });
  });

  // --- GetPublicProfile ---

  describe('GetPublicProfileHandler', () => {
    let handler: GetPublicProfileHandler;
    beforeEach(() => (handler = new GetPublicProfileHandler(repo)));

    it('should return public response without private fields', async () => {
      repo.findOwnerProfile.mockResolvedValue(profileWithMedia);

      const result = await handler.execute(new GetPublicProfileQuery());

      expect(result.fullName).toEqual({ en: 'John Doe', vi: 'Nguyen Van A' });
      expect(result.avatarUrl).toBe('https://cdn.example.com/avatar.jpg');
      expect((result as any).id).toBeUndefined();
      expect((result as any).userId).toBeUndefined();
      expect((result as any).phone).toBeUndefined();
      expect((result as any).locationPostalCode).toBeUndefined();
      expect((result as any).locationAddress1).toBeUndefined();
    });

    it('should throw NotFound when profile does not exist', async () => {
      repo.findOwnerProfile.mockResolvedValue(null);

      await expect(handler.execute(new GetPublicProfileQuery())).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'PROFILE_NOT_FOUND',
      });
    });
  });

  // --- GetJsonLd ---

  describe('GetJsonLdHandler', () => {
    let handler: GetJsonLdHandler;
    beforeEach(() => (handler = new GetJsonLdHandler(repo)));

    it('should return valid Schema.org structure', async () => {
      repo.findOwnerProfile.mockResolvedValue(profileWithMedia);

      const result = await handler.execute(new GetJsonLdQuery('en'));

      expect(result['@context']).toBe('https://schema.org');
      expect(result['@type']).toBe('Person');
      expect(result.name).toBe('John Doe');
      expect(result.jobTitle).toBe('Developer');
      expect(result.description).toBe('A dev');
      expect(result.image).toBe('https://cdn.example.com/avatar.jpg');
      expect(result.email).toBe('john@example.com');
      expect(result.address).toEqual({
        '@type': 'PostalAddress',
        addressLocality: 'HCMC',
        addressCountry: 'Vietnam',
      });
      expect(result.sameAs).toEqual(['https://github.com/john']);
    });

    it('should switch locale to Vietnamese', async () => {
      repo.findOwnerProfile.mockResolvedValue(profileWithMedia);

      const result = await handler.execute(new GetJsonLdQuery('vi'));

      expect(result.name).toBe('Nguyen Van A');
      expect(result.jobTitle).toBe('Lap trinh vien');
      expect(result.description).toBe('Mot dev');
    });

    it('should throw NotFound when profile does not exist', async () => {
      repo.findOwnerProfile.mockResolvedValue(null);

      await expect(handler.execute(new GetJsonLdQuery())).rejects.toMatchObject({
        statusCode: 404,
        errorCode: 'PROFILE_NOT_FOUND',
      });
    });
  });
});
