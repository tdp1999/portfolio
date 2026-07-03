import type { Profile as PrismaProfile } from '@prisma/client';
import { ProfileMapper } from './profile.mapper';

const RAW_PROFILE: PrismaProfile = {
  id: '00000000-0000-0000-0000-000000000001',
  userId: '00000000-0000-0000-0000-000000000002',
  fullName: { en: 'John Doe', vi: 'Nguyen Van A' },
  title: { en: 'Software Engineer', vi: 'Ky su phan mem' },
  bioShort: { en: 'I build things', vi: 'Toi xay dung' },
  bioLongJson: null,
  bioLongHtml: null,
  bioLongSchemaVersion: 1,
  bioLongCanonical: null,
  yearsOfExperience: 8,
  availability: 'EMPLOYED',
  openTo: ['FREELANCE'],
  workingHours: null,
  email: 'john@example.com',
  phone: null,
  phoneZalo: null,
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
  aboutHeading: null,
  aboutLede: null,
  ctaHeading: null,
  ctaLede: null,
  coreStack: ['Angular', 'TypeScript', 'Angular Material'],
  timezones: [],
  canonicalUrl: null,
  contentUpdatedAt: null,
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

    it('should preserve a null phoneZalo through both directions', () => {
      const domain = ProfileMapper.toDomain(RAW_PROFILE);
      const prisma = ProfileMapper.toPrisma(domain);
      expect(domain.phoneZalo).toBeNull();
      expect(prisma.phoneZalo).toBeNull();
    });

    it('should preserve a non-null phoneZalo through both directions', () => {
      const raw: PrismaProfile = { ...RAW_PROFILE, phoneZalo: '+84901234567' };
      const domain = ProfileMapper.toDomain(raw);
      const prisma = ProfileMapper.toPrisma(domain);
      expect(domain.phoneZalo).toBe('+84901234567');
      expect(prisma.phoneZalo).toBe('+84901234567');
    });

    it('should preserve about narrative copy + contentUpdatedAt through both directions', () => {
      const stamp = new Date('2026-05-23T10:00:00.000Z');
      const raw: PrismaProfile = {
        ...RAW_PROFILE,
        aboutHeading: { en: 'About', vi: 'Ve toi' },
        aboutLede: { en: 'Lede', vi: 'Mo dau' },
        ctaHeading: { en: 'CTA', vi: 'Hanh dong' },
        ctaLede: { en: 'Door', vi: 'Cua' },
        contentUpdatedAt: stamp,
      };
      const domain = ProfileMapper.toDomain(raw);
      expect(domain.aboutHeading).toEqual({ en: 'About', vi: 'Ve toi' });
      expect(domain.aboutLede).toEqual({ en: 'Lede', vi: 'Mo dau' });
      expect(domain.ctaHeading).toEqual({ en: 'CTA', vi: 'Hanh dong' });
      expect(domain.ctaLede).toEqual({ en: 'Door', vi: 'Cua' });
      expect(domain.contentUpdatedAt).toEqual(stamp);

      const prisma = ProfileMapper.toPrisma(domain);
      expect(prisma.aboutHeading).toEqual({ en: 'About', vi: 'Ve toi' });
      expect(prisma.aboutLede).toEqual({ en: 'Lede', vi: 'Mo dau' });
      expect(prisma.ctaHeading).toEqual({ en: 'CTA', vi: 'Hanh dong' });
      expect(prisma.ctaLede).toEqual({ en: 'Door', vi: 'Cua' });
      expect(prisma.contentUpdatedAt).toEqual(stamp);
    });
  });

  describe('toDomain — rich-text storage passthrough', () => {
    it('maps bioLong Json/Html/SchemaVersion onto matching fields (no field swap)', () => {
      const bioLongJson = { en: { doc: 'bio-json-en' }, vi: { doc: 'bio-json-vi' } };
      const bioLongHtml = { en: '<p>bio-html-en</p>', vi: '<p>bio-html-vi</p>' };
      const raw: PrismaProfile = { ...RAW_PROFILE, bioLongJson, bioLongHtml, bioLongSchemaVersion: 3 };

      const profile = ProfileMapper.toDomain(raw);

      expect(profile.bioLongJson).toEqual(bioLongJson);
      expect(profile.bioLongHtml).toEqual(bioLongHtml);
      expect(profile.bioLongSchemaVersion).toBe(3);
    });
  });
});
