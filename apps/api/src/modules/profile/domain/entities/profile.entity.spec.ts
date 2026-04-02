import { Profile } from './profile.entity';
import { IProfileProps, ICreateProfilePayload } from '../profile.types';
import type { TranslatableJson } from '@portfolio/shared/types';

describe('Profile Entity', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const fullName: TranslatableJson = { en: 'John Doe', vi: 'Nguyen Van A' };
  const title: TranslatableJson = { en: 'Software Engineer', vi: 'Ky su phan mem' };
  const bioShort: TranslatableJson = { en: 'I build things', vi: 'Toi xay dung' };

  const createPayload: ICreateProfilePayload = {
    userId: '550e8400-e29b-41d4-a716-446655440002',
    fullName,
    title,
    bioShort,
    yearsOfExperience: 8,
    email: 'john@example.com',
    preferredContactValue: 'https://linkedin.com/in/johndoe',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh',
  };

  const validProps: IProfileProps = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440002',
    fullName,
    title,
    bioShort,
    bioLong: { en: 'Long bio...', vi: 'Bio dai...' },
    yearsOfExperience: 8,
    availability: 'EMPLOYED',
    openTo: ['FREELANCE', 'CONSULTING'],
    email: 'john@example.com',
    phone: '+84123456789',
    preferredContactPlatform: 'LINKEDIN',
    preferredContactValue: 'https://linkedin.com/in/johndoe',
    locationCountry: 'Vietnam',
    locationCity: 'Ho Chi Minh',
    locationPostalCode: '70000',
    locationAddress1: '123 Main St',
    locationAddress2: null,
    socialLinks: [{ platform: 'GITHUB', url: 'https://github.com/johndoe' }],
    resumeUrls: { en: 'https://example.com/cv-en.pdf' },
    certifications: [{ name: 'AWS SAA', issuer: 'Amazon', year: 2024 }],
    metaTitle: 'John Doe Portfolio',
    metaDescription: 'Full-stack engineer portfolio',
    ogImageId: null,
    timezone: 'Asia/Ho_Chi_Minh',
    canonicalUrl: 'https://johndoe.dev',
    avatarId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
  };

  describe('create()', () => {
    it('should generate UUID v7, set audit fields, and apply business defaults', () => {
      const profile = Profile.create(createPayload, userId);

      expect(profile.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
      expect(profile.createdById).toBe(userId);
      expect(profile.updatedById).toBe(userId);

      // Business defaults
      expect(profile.availability).toBe('EMPLOYED');
      expect(profile.openTo).toEqual([]);
      expect(profile.bioLong).toBeNull();
      expect(profile.phone).toBeNull();
      expect(profile.preferredContactPlatform).toBe('LINKEDIN');
      expect(profile.socialLinks).toEqual([]);
      expect(profile.resumeUrls).toEqual({});
      expect(profile.certifications).toEqual([]);
    });
  });

  describe('update()', () => {
    it('should allow clearing nullable fields by setting to null', () => {
      const profile = Profile.load(validProps);

      const updated = profile.update({ phone: null, metaTitle: null, timezone: null, canonicalUrl: null }, userId);

      expect(updated.phone).toBeNull();
      expect(updated.metaTitle).toBeNull();
      expect(updated.timezone).toBeNull();
      expect(updated.canonicalUrl).toBeNull();
      expect(updated.updatedById).toBe(userId);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(profile.updatedAt.getTime());
    });
  });

  describe('isOpenToWork', () => {
    it('should return true when availability is OPEN_TO_WORK', () => {
      const profile = Profile.load({ ...validProps, availability: 'OPEN_TO_WORK', openTo: [] });

      expect(profile.isOpenToWork).toBe(true);
    });

    it('should return true when EMPLOYED with non-empty openTo', () => {
      const profile = Profile.load({ ...validProps, availability: 'EMPLOYED', openTo: ['FREELANCE'] });

      expect(profile.isOpenToWork).toBe(true);
    });

    it('should return false when EMPLOYED with empty openTo', () => {
      const profile = Profile.load({ ...validProps, availability: 'EMPLOYED', openTo: [] });

      expect(profile.isOpenToWork).toBe(false);
    });

    it('should return false when FREELANCING', () => {
      const profile = Profile.load({ ...validProps, availability: 'FREELANCING', openTo: ['CONSULTING'] });

      expect(profile.isOpenToWork).toBe(false);
    });

    it('should return false when NOT_AVAILABLE', () => {
      const profile = Profile.load({ ...validProps, availability: 'NOT_AVAILABLE', openTo: [] });

      expect(profile.isOpenToWork).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should return a new instance on mutation, leaving original unchanged', () => {
      const original = Profile.load(validProps);

      const updated = original.update({ email: 'changed@example.com' }, userId);

      expect(updated).not.toBe(original);
      expect(original.email).toBe('john@example.com');
      expect(updated.email).toBe('changed@example.com');
    });
  });
});
