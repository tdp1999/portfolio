import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/prisma';
import { IProfileRepository, ProfileWithMedia } from '../../application/ports/profile.repository.port';
import { Profile } from '../../domain/entities/profile.entity';
import { Identity, WorkAvailability, Contact, Location, SocialLinks, SeoOg } from '../../domain/value-objects';
import { ProfileMapper } from '../mapper/profile.mapper';

@Injectable()
export class ProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Profile | null> {
    const raw = await this.prisma.profile.findUnique({ where: { userId } });
    return raw ? ProfileMapper.toDomain(raw) : null;
  }

  async findOwnerProfile(): Promise<ProfileWithMedia | null> {
    const raw = await this.prisma.profile.findFirst({
      where: { user: { role: 'ADMIN' } },
      orderBy: { user: { createdAt: 'asc' } },
      include: { avatar: true, ogImage: true },
    });
    return raw ? ProfileMapper.toDomainWithMedia(raw) : null;
  }

  async findWithMedia(userId: string): Promise<ProfileWithMedia | null> {
    const raw = await this.prisma.profile.findUnique({
      where: { userId },
      include: { avatar: true, ogImage: true },
    });
    return raw ? ProfileMapper.toDomainWithMedia(raw) : null;
  }

  async updateAvatar(userId: string, avatarId: string | null): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: { avatarId },
    });
  }

  async updateOgImage(userId: string, ogImageId: string | null): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: { ogImageId },
    });
  }

  async updateIdentity(userId: string, identity: Identity, updatedById: string): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: {
        fullName: identity.fullName as unknown as Prisma.InputJsonValue,
        title: identity.title as unknown as Prisma.InputJsonValue,
        bioShort: identity.bioShort as unknown as Prisma.InputJsonValue,
        bioLong: (identity.bioLong as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
        avatarId: identity.avatarId,
        updatedById,
      },
    });
  }

  async updateWorkAvailability(userId: string, workAvailability: WorkAvailability, updatedById: string): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: {
        yearsOfExperience: workAvailability.yearsOfExperience,
        availability: workAvailability.availability,
        openTo: workAvailability.openTo as unknown as Prisma.InputJsonValue,
        timezone: workAvailability.timezone,
        updatedById,
      },
    });
  }

  async updateContact(userId: string, contact: Contact, updatedById: string): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: {
        email: contact.email,
        phone: contact.phone,
        preferredContactPlatform: contact.preferredContactPlatform,
        preferredContactValue: contact.preferredContactValue,
        updatedById,
      },
    });
  }

  async updateLocation(userId: string, location: Location, updatedById: string): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: {
        locationCountry: location.country,
        locationCity: location.city,
        locationPostalCode: location.postalCode,
        locationAddress1: location.address1,
        locationAddress2: location.address2,
        updatedById,
      },
    });
  }

  async updateSocialLinks(userId: string, socialLinks: SocialLinks, updatedById: string): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: {
        socialLinks: socialLinks.socialLinks as unknown as Prisma.InputJsonValue,
        resumeUrls: socialLinks.resumeUrls as unknown as Prisma.InputJsonValue,
        certifications: socialLinks.certifications as unknown as Prisma.InputJsonValue,
        updatedById,
      },
    });
  }

  async updateSeoOg(userId: string, seoOg: SeoOg, updatedById: string): Promise<void> {
    await this.prisma.profile.update({
      where: { userId },
      data: {
        metaTitle: seoOg.metaTitle,
        metaDescription: seoOg.metaDescription,
        ogImageId: seoOg.ogImageId,
        canonicalUrl: seoOg.canonicalUrl,
        updatedById,
      },
    });
  }
}
