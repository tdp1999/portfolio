import { Profile as PrismaProfile, Media, Prisma } from '@prisma/client';
import { Profile } from '../../domain/entities/profile.entity';
import { IProfileProps, Availability, WorkingHoursValue } from '../../domain/profile.types';
import type { ProfileWithMedia } from '../../application/ports/profile.repository.port';
import type { TranslatableJson, SocialLink, OpenToValue, SocialPlatform } from '@portfolio/shared/types';
import {
  PersistenceTranslatableSchema,
  SocialLinksArraySchema,
  CertificationsArraySchema,
  ResumeUrlsSchema,
  OpenToSchema,
} from '@portfolio/shared/utils';

type PrismaProfileWithMedia = PrismaProfile & {
  avatar: Media | null;
  ogImage: Media | null;
};

const parseTranslatableNullable = (raw: unknown): TranslatableJson | null =>
  raw == null ? null : (PersistenceTranslatableSchema.parse(raw) as TranslatableJson);

const parseTimezones = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === 'string');
};

const parseStringArray = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((v): v is string => typeof v === 'string');
};

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const parseWorkingHours = (raw: unknown): WorkingHoursValue | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const start = obj['start'];
  const end = obj['end'];
  if (typeof start !== 'string' || typeof end !== 'string') return null;
  if (!HHMM.test(start) || !HHMM.test(end)) return null;
  return { start, end };
};

export class ProfileMapper {
  static toDomain(raw: PrismaProfile): Profile {
    const props: IProfileProps = {
      id: raw.id,
      userId: raw.userId,
      fullName: PersistenceTranslatableSchema.parse(raw.fullName),
      title: PersistenceTranslatableSchema.parse(raw.title),
      bioShort: PersistenceTranslatableSchema.parse(raw.bioShort),
      bioLong: parseTranslatableNullable(raw.bioLong),
      yearsOfExperience: raw.yearsOfExperience,
      availability: raw.availability as Availability,
      openTo: OpenToSchema.parse(raw.openTo) as OpenToValue[],
      workingHours: parseWorkingHours(raw.workingHours),
      email: raw.email,
      phone: raw.phone,
      preferredContactPlatform: raw.preferredContactPlatform as SocialPlatform,
      preferredContactValue: raw.preferredContactValue,
      locationCountry: raw.locationCountry,
      locationCity: raw.locationCity,
      locationPostalCode: raw.locationPostalCode,
      locationAddress1: raw.locationAddress1,
      locationAddress2: raw.locationAddress2,
      socialLinks: SocialLinksArraySchema.parse(raw.socialLinks) as SocialLink[],
      resumeUrls: ResumeUrlsSchema.parse(raw.resumeUrls),
      certifications: CertificationsArraySchema.parse(raw.certifications),
      metaTitle: raw.metaTitle,
      metaDescription: raw.metaDescription,
      ogImageId: raw.ogImageId,
      tagline: parseTranslatableNullable(raw.tagline),
      stackIntro: parseTranslatableNullable(raw.stackIntro),
      selectedWorkIntro: parseTranslatableNullable(raw.selectedWorkIntro),
      contactIntro: parseTranslatableNullable(raw.contactIntro),
      footerTagline: parseTranslatableNullable(raw.footerTagline),
      coreStack: parseStringArray(raw.coreStack),
      timezones: parseTimezones(raw.timezones),
      canonicalUrl: raw.canonicalUrl,
      avatarId: raw.avatarId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdById: raw.createdById,
      updatedById: raw.updatedById,
    };
    return Profile.load(props);
  }

  static toPrisma(profile: Profile): Prisma.ProfileUncheckedCreateInput {
    return {
      id: profile.id,
      userId: profile.userId,
      fullName: profile.fullName as unknown as Prisma.InputJsonValue,
      title: profile.title as unknown as Prisma.InputJsonValue,
      bioShort: profile.bioShort as unknown as Prisma.InputJsonValue,
      bioLong: (profile.bioLong as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      yearsOfExperience: profile.yearsOfExperience,
      availability: profile.availability,
      openTo: profile.openTo as unknown as Prisma.InputJsonValue,
      workingHours: (profile.workingHours as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      email: profile.email,
      phone: profile.phone,
      preferredContactPlatform: profile.preferredContactPlatform,
      preferredContactValue: profile.preferredContactValue,
      locationCountry: profile.locationCountry,
      locationCity: profile.locationCity,
      locationPostalCode: profile.locationPostalCode,
      locationAddress1: profile.locationAddress1,
      locationAddress2: profile.locationAddress2,
      socialLinks: profile.socialLinks as unknown as Prisma.InputJsonValue,
      resumeUrls: profile.resumeUrls as unknown as Prisma.InputJsonValue,
      certifications: profile.certifications as unknown as Prisma.InputJsonValue,
      metaTitle: profile.metaTitle,
      metaDescription: profile.metaDescription,
      ogImageId: profile.ogImageId,
      tagline: (profile.tagline as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      stackIntro: (profile.stackIntro as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      selectedWorkIntro: (profile.selectedWorkIntro as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      contactIntro: (profile.contactIntro as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      footerTagline: (profile.footerTagline as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      coreStack: profile.coreStack as unknown as Prisma.InputJsonValue,
      timezones: profile.timezones as unknown as Prisma.InputJsonValue,
      canonicalUrl: profile.canonicalUrl,
      avatarId: profile.avatarId,
      createdById: profile.createdById,
      updatedById: profile.updatedById,
    };
  }

  static toDomainWithMedia(raw: PrismaProfileWithMedia): ProfileWithMedia {
    return {
      profile: ProfileMapper.toDomain(raw),
      avatarUrl: raw.avatar?.url ?? null,
      ogImageUrl: raw.ogImage?.url ?? null,
    };
  }
}
