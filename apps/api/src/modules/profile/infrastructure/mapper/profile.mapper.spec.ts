import type { Profile as PrismaProfile } from '@prisma/client';
import { ProfileMapper } from './profile.mapper';

const RAW_PROFILE: PrismaProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000002',
  fullName: { en: 'John Doe', vi: 'Nguyen Van A' },
  title: { en: 'Software Engineer', vi: 'Ky su phan mem' },
  bioShort: { en: 'I build things', vi: 'Toi xay dung' },
  bioLong: null,
  yearsOfExperience: 8,
  availability: 'EMPLOYED',
  openTo: ['FREELANCE'],
  workingHours: null,
  email: 'john@example.com',
  phone: null,
  preferredContactPlatform: 'LINKEDIN',
  preferredContactValue: 'https://linkedin.com/in/johndoe',
  locationCountry: 'Vietnam',
  locationCity: 'Ho Chi Minh',
  locationPostalCode: null,
  locationAddress1: null,
  locationAddress2: null,
  socialLinks: [],
  resumeUrls: {},
  certifications: [],
  metaTitle: null,
  metaDescription: null,
  ogImageId: null,
  tagline: null,
  stackIntro: null,
  selectedWorkIntro: null,
  contactIntro: null,
  footerTagline: null,
  coreStack: ['Angular', 'TypeScript', 'Angular Material'],
  timezones: [],
  canonicalUrl: null,
  avatarId: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  createdById: '00000000-0000-0000-0000-000000000099',
  updatedById: '00000000-0000-0000-0000-000000000099',
};

describe('ProfileMapper', () => {
  describe('toDomain — coreStack parsing (parseStringArray)', () => {
    it.each([
      ['null', null],
      ['object', { not: 'an array' }],
      ['string', 'foo'],
      ['number', 42],
    ])('should coerce a non-array coreStack (%s) to []', (_label, badValue) => {
      const raw: PrismaProfile = { ...RAW_PROFILE, coreStack: badValue as unknown as PrismaProfile['coreStack'] };

      const profile = ProfileMapper.toDomain(raw);

      expect(profile.coreStack).toEqual([]);
    });

    it('should filter out non-string entries from a mixed-type coreStack array', () => {
      const raw: PrismaProfile = {
        ...RAW_PROFILE,
        coreStack: [
          'Angular',
          1,
          null,
          'TypeScript',
          { x: 1 },
          true,
          'Material',
        ] as unknown as PrismaProfile['coreStack'],
      };

      const profile = ProfileMapper.toDomain(raw);

      expect(profile.coreStack).toEqual(['Angular', 'TypeScript', 'Material']);
    });
  });

  describe('round-trip toDomain → toPrisma', () => {
    it('should preserve coreStack exactly in order', () => {
      const domain = ProfileMapper.toDomain(RAW_PROFILE);
      const prisma = ProfileMapper.toPrisma(domain);

      expect(prisma.coreStack).toEqual(['Angular', 'TypeScript', 'Angular Material']);
    });
  });
});
