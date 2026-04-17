import { Profile as PrismaProfile, Media, Prisma } from '@prisma/client';
import { Profile } from '../../domain/entities/profile.entity';
import { IProfileProps, Availability } from '../../domain/profile.types';
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

export class ProfileMapper {
  static toDomain(raw: PrismaProfile): Profile {
    const props: IProfileProps = {
      id: raw.id,
      userId: raw.userId,
      fullName: PersistenceTranslatableSchema.parse(raw.fullName),
      title: PersistenceTranslatableSchema.parse(raw.title),
      bioShort: PersistenceTranslatableSchema.parse(raw.bioShort),
      bioLong: raw.bioLong != null ? (PersistenceTranslatableSchema.parse(raw.bioLong) as TranslatableJson) : null,
      yearsOfExperience: raw.yearsOfExperience,
      availability: raw.availability as Availability,
      openTo: OpenToSchema.parse(raw.openTo) as OpenToValue[],
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
      timezone: raw.timezone,
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
      timezone: profile.timezone,
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
