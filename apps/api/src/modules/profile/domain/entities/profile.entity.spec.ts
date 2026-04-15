import { Profile } from './profile.entity';
import { Contact } from '../value-objects';
import type { IProfileProps, ICreateProfilePayload } from '../profile.types';
import type { TranslatableJson } from '@portfolio/shared/types';

describe('Profile Entity', () => {
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  const validProps: IProfileProps = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    userId: '550e8400-e29b-41d4-a716-446655440002',
    fullName: { en: 'John Doe', vi: 'Nguyen Van A' },
    title: { en: 'Software Engineer', vi: 'Ky su phan mem' },
    bioShort: { en: 'I build things', vi: 'Toi xay dung' },
    bioLong: null,
    yearsOfExperience: 8,
    availability: 'EMPLOYED',
    openTo: ['FREELANCE'],
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
    timezone: null,
    canonicalUrl: null,
    avatarId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdById: userId,
    updatedById: userId,
  };

  describe('create() — factory defaults', () => {
    const createPayload: ICreateProfilePayload = {
      userId: '550e8400-e29b-41d4-a716-446655440002',
      fullName: { en: 'John Doe', vi: 'Nguyen Van A' },
      title: { en: 'Developer', vi: 'Lap trinh vien' },
      bioShort: { en: 'A dev', vi: 'Mot dev' },
      yearsOfExperience: 8,
      email: 'john@example.com',
      preferredContactValue: 'https://linkedin.com/in/johndoe',
      locationCountry: 'Vietnam',
      locationCity: 'Ho Chi Minh',
    };

    it('should generate UUID v7, set audit fields, and apply business defaults', () => {
      const profile = Profile.create(createPayload, userId);

      expect(profile.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.createdById).toBe(userId);
      // Business defaults
      expect(profile.availability).toBe('EMPLOYED');
      expect(profile.openTo).toEqual([]);
      expect(profile.preferredContactPlatform).toBe('LINKEDIN');
      expect(profile.socialLinks).toEqual([]);
      expect(profile.resumeUrls).toEqual({});
    });
  });

  describe('withSection() — section replacement', () => {
    it('should replace only the specified section and update audit fields', () => {
      const profile = Profile.load(validProps);
      const newContact = Contact.create({
        email: 'new@example.com',
        phone: null,
        preferredContactPlatform: 'GITHUB',
        preferredContactValue: 'github.com/john',
      });

      const updated = profile.withContact(newContact, userId);

      expect(updated.email).toBe('new@example.com');
      expect(updated.fullName).toEqual(validProps.fullName); // other sections unchanged
      expect(updated.locationCountry).toBe('Vietnam'); // other sections unchanged
      expect(updated.updatedById).toBe(userId);
      expect(updated).not.toBe(profile);
    });
  });

  describe('isOpenToWork — delegation to WorkAvailability', () => {
    it('should delegate to workAvailability VO', () => {
      const open = Profile.load({ ...validProps, availability: 'OPEN_TO_WORK', openTo: [] });
      const closed = Profile.load({ ...validProps, availability: 'NOT_AVAILABLE', openTo: [] });

      expect(open.isOpenToWork).toBe(true);
      expect(closed.isOpenToWork).toBe(false);
    });
  });

  describe('immutability', () => {
    it('should return a new instance on mutation without changing the original', () => {
      const original = Profile.load(validProps);
      const newContact = Contact.create({
        email: 'changed@example.com',
        phone: null,
        preferredContactPlatform: 'LINKEDIN',
        preferredContactValue: 'https://linkedin.com/in/johndoe',
      });

      const updated = original.withContact(newContact, userId);

      expect(updated).not.toBe(original);
      expect(original.email).toBe('john@example.com');
    });
  });

  describe('no flat update method', () => {
    it('should not expose an update() method', () => {
      const profile = Profile.load(validProps);

      expect((profile as any).update).toBeUndefined();
    });
  });
});
