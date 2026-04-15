import { Prisma } from '@prisma/client';
import { ProfileRepository } from './profile.repository';
import { PrismaService } from '../../../../infrastructure/prisma';
import { Identity, WorkAvailability, Contact, Location, SocialLinks, SeoOg } from '../../domain/value-objects';

describe('ProfileRepository — section updates', () => {
  let repo: ProfileRepository;
  let update: jest.Mock;
  let prisma: { profile: { update: jest.Mock } };

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const updatedById = '550e8400-e29b-41d4-a716-446655440001';
  const avatarId = '550e8400-e29b-41d4-a716-446655440002';
  const ogImageId = '550e8400-e29b-41d4-a716-446655440003';

  beforeEach(() => {
    update = jest.fn().mockResolvedValue({});
    prisma = { profile: { update } };
    repo = new ProfileRepository(prisma as unknown as PrismaService);
  });

  const keysOf = (call: jest.Mock) => Object.keys(call.mock.calls[0][0].data).sort();
  const dataOf = (call: jest.Mock) => call.mock.calls[0][0].data;
  const whereOf = (call: jest.Mock) => call.mock.calls[0][0].where;

  // --- updateIdentity ---

  describe('updateIdentity', () => {
    const identity = Identity.fromPersistence({
      fullName: { en: 'Jane', vi: 'Tran' },
      title: { en: 'Designer', vi: 'Nha thiet ke' },
      bioShort: { en: 'Short', vi: 'Ngan' },
      bioLong: { en: 'Long', vi: 'Dai' },
      avatarId,
    });

    it('writes only Identity columns + updatedById', async () => {
      await repo.updateIdentity(userId, identity, updatedById);

      expect(whereOf(update)).toEqual({ userId });
      expect(keysOf(update)).toEqual(['avatarId', 'bioLong', 'bioShort', 'fullName', 'title', 'updatedById'].sort());
      const data = dataOf(update);
      expect(data.avatarId).toBe(avatarId);
      expect(data.updatedById).toBe(updatedById);
    });

    it('translates bioLong=null to Prisma.DbNull', async () => {
      const identityNoBio = Identity.fromPersistence({
        fullName: { en: 'Jane', vi: 'Tran' },
        title: { en: 'Designer', vi: 'Nha thiet ke' },
        bioShort: { en: 'Short', vi: 'Ngan' },
        bioLong: null,
        avatarId: null,
      });

      await repo.updateIdentity(userId, identityNoBio, updatedById);

      expect(dataOf(update).bioLong).toBe(Prisma.DbNull);
    });
  });

  // --- updateWorkAvailability ---

  describe('updateWorkAvailability', () => {
    const work = WorkAvailability.fromPersistence({
      yearsOfExperience: 8,
      availability: 'OPEN_TO_WORK',
      openTo: ['FULL_TIME'],
      timezone: 'Asia/Ho_Chi_Minh',
    });

    it('writes only WorkAvailability columns + updatedById', async () => {
      await repo.updateWorkAvailability(userId, work, updatedById);

      expect(whereOf(update)).toEqual({ userId });
      expect(keysOf(update)).toEqual(['availability', 'openTo', 'timezone', 'updatedById', 'yearsOfExperience'].sort());
    });
  });

  // --- updateContact ---

  describe('updateContact', () => {
    const contact = Contact.fromPersistence({
      email: 'jane@example.com',
      phone: null,
      preferredContactPlatform: 'LINKEDIN',
      preferredContactValue: 'linkedin.com/in/jane',
    });

    it('writes only Contact columns + updatedById', async () => {
      await repo.updateContact(userId, contact, updatedById);

      expect(whereOf(update)).toEqual({ userId });
      expect(keysOf(update)).toEqual(
        ['email', 'phone', 'preferredContactPlatform', 'preferredContactValue', 'updatedById'].sort()
      );
    });
  });

  // --- updateLocation ---

  describe('updateLocation', () => {
    const location = Location.fromPersistence({
      country: 'Vietnam',
      city: 'Hanoi',
      postalCode: '10000',
      address1: '1 Nguyen Trai',
      address2: null,
    });

    it('writes only Location columns (VO getters mapped to column names) + updatedById', async () => {
      await repo.updateLocation(userId, location, updatedById);

      expect(whereOf(update)).toEqual({ userId });
      expect(keysOf(update)).toEqual(
        [
          'locationAddress1',
          'locationAddress2',
          'locationCity',
          'locationCountry',
          'locationPostalCode',
          'updatedById',
        ].sort()
      );
      const data = dataOf(update);
      expect(data.locationCountry).toBe('Vietnam');
      expect(data.locationCity).toBe('Hanoi');
    });
  });

  // --- updateSocialLinks ---

  describe('updateSocialLinks', () => {
    const links = SocialLinks.fromPersistence({
      socialLinks: [{ platform: 'GITHUB', url: 'https://github.com/jane' }],
      resumeUrls: { en: 'https://example.com/cv-en.pdf' },
      certifications: [],
    });

    it('writes only SocialLinks columns + updatedById', async () => {
      await repo.updateSocialLinks(userId, links, updatedById);

      expect(whereOf(update)).toEqual({ userId });
      expect(keysOf(update)).toEqual(['certifications', 'resumeUrls', 'socialLinks', 'updatedById'].sort());
    });
  });

  // --- updateSeoOg ---

  describe('updateSeoOg', () => {
    const seo = SeoOg.fromPersistence({
      metaTitle: 'Portfolio',
      metaDescription: 'A short description',
      ogImageId,
      canonicalUrl: 'https://example.com',
    });

    it('writes only SeoOg columns + updatedById', async () => {
      await repo.updateSeoOg(userId, seo, updatedById);

      expect(whereOf(update)).toEqual({ userId });
      expect(keysOf(update)).toEqual(
        ['canonicalUrl', 'metaDescription', 'metaTitle', 'ogImageId', 'updatedById'].sort()
      );
    });
  });
});
