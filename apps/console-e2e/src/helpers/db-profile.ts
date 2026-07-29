import { randomUUID } from 'crypto';
import { prisma } from './db';

/**
 * Ensure a profile exists for the given user. If one already exists, reset it to seed defaults.
 * Returns the profile id.
 *
 * **This resets shared state, so the specs that call it cannot run in parallel with each other.**
 * `profile-per-section`, `profile-avatar-picker`, `profile-certification-picker` and
 * `profile-resume-picker` all seed the *same* row (the admin user's single profile), wiping
 * `avatarId` / `ogImageId` / `certifications` / `resumeUrls` in their `beforeEach`. One file's reset
 * lands in the middle of another file's assertions, and the symptom is a picker that reads empty
 * when the test just filled it.
 *
 * CI is immune: each shard is its own runner with its own Postgres, and `workers: 1` inside a shard
 * makes everything serial (see `.github/workflows/ci.yml`). Locally, `fullyParallel: true` and an
 * unset `workers` mean these four files land in four workers at once, so run them with
 * `--workers=1` when you run more than one of them. `test.describe.configure({ mode: 'serial' })`
 * does **not** help — it orders tests inside one file and says nothing about files racing each
 * other, and it suppresses the rest of the file after the first failure, which hides evidence.
 *
 * The durable fix is a profile row per spec file rather than four files sharing one; that needs
 * extra seeded users and is tracked in task 386.
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
        // `timezone` became `timezones`, a JSON array of IANA zones.
        timezones: [],
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
