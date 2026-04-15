import { randomUUID } from 'crypto';
import { prisma } from './db';

/**
 * Ensure a profile exists for the given user. If one already exists, reset it to seed defaults.
 * Returns the profile id.
 */
export async function seedProfile(userId: string, email: string): Promise<string> {
  const existing = await prisma.profile.findUnique({ where: { userId } });
  if (existing) {
    await prisma.profile.update({
      where: { userId },
      data: {
        fullName: { en: 'E2E Admin', vi: 'Quản trị E2E' },
        title: { en: 'QA Engineer', vi: 'Kỹ sư QA' },
        bioShort: { en: 'E2E test bio.', vi: 'Tiểu sử E2E.' },
        bioLong: null,
        yearsOfExperience: 5,
        availability: 'EMPLOYED',
        openTo: [],
        email,
        phone: null,
        preferredContactPlatform: 'GITHUB',
        preferredContactValue: 'e2e-admin',
        locationCountry: 'Vietnam',
        locationCity: 'Ho Chi Minh City',
        locationPostalCode: null,
        locationAddress1: null,
        locationAddress2: null,
        socialLinks: [],
        resumeUrls: {},
        certifications: [],
        timezone: null,
        metaTitle: null,
        metaDescription: null,
        canonicalUrl: null,
        avatarId: null,
        ogImageId: null,
        updatedById: userId,
      },
    });
    return existing.id;
  }

  const id = randomUUID();
  await prisma.profile.create({
    data: {
      id,
      userId,
      fullName: { en: 'E2E Admin', vi: 'Quản trị E2E' },
      title: { en: 'QA Engineer', vi: 'Kỹ sư QA' },
      bioShort: { en: 'E2E test bio.', vi: 'Tiểu sử E2E.' },
      yearsOfExperience: 5,
      availability: 'EMPLOYED',
      email,
      preferredContactPlatform: 'GITHUB',
      preferredContactValue: 'e2e-admin',
      locationCountry: 'Vietnam',
      locationCity: 'Ho Chi Minh City',
      createdById: userId,
      updatedById: userId,
    },
  });
  return id;
}

export async function deleteProfile(userId: string): Promise<void> {
  await prisma.profile.deleteMany({ where: { userId } });
}
