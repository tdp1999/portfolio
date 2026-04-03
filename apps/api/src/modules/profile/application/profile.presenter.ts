import { getLocalized } from '@portfolio/shared/utils';
import type { Locale } from '@portfolio/shared/types';
import { Profile } from '../domain/entities/profile.entity';
import type { ProfilePublicResponseDto, ProfileAdminResponseDto, ProfileJsonLdDto } from './profile.dto';

export class ProfilePresenter {
  static toPublicResponse(
    profile: Profile,
    avatarUrl: string | null,
    ogImageUrl: string | null
  ): ProfilePublicResponseDto {
    return {
      fullName: profile.fullName,
      title: profile.title,
      bioShort: profile.bioShort,
      bioLong: profile.bioLong,
      yearsOfExperience: profile.yearsOfExperience,
      availability: profile.availability,
      openTo: profile.openTo,
      email: profile.email,
      preferredContactPlatform: profile.preferredContactPlatform,
      preferredContactValue: profile.preferredContactValue,
      locationCountry: profile.locationCountry,
      locationCity: profile.locationCity,
      socialLinks: profile.socialLinks,
      resumeUrls: profile.resumeUrls,
      certifications: profile.certifications,
      avatarUrl,
      ogImageUrl,
      metaTitle: profile.metaTitle,
      metaDescription: profile.metaDescription,
      timezone: profile.timezone,
      canonicalUrl: profile.canonicalUrl,
    };
  }

  static toAdminResponse(
    profile: Profile,
    avatarUrl: string | null,
    ogImageUrl: string | null
  ): ProfileAdminResponseDto {
    return {
      ...ProfilePresenter.toPublicResponse(profile, avatarUrl, ogImageUrl),
      id: profile.id,
      userId: profile.userId,
      phone: profile.phone,
      locationPostalCode: profile.locationPostalCode,
      locationAddress1: profile.locationAddress1,
      locationAddress2: profile.locationAddress2,
      avatarId: profile.avatarId,
      ogImageId: profile.ogImageId,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      createdById: profile.createdById,
      updatedById: profile.updatedById,
    };
  }

  static toJsonLd(profile: Profile, locale: Locale, avatarUrl: string | null): ProfileJsonLdDto {
    return {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: getLocalized(profile.fullName, locale),
      jobTitle: getLocalized(profile.title, locale),
      description: getLocalized(profile.bioShort, locale),
      image: avatarUrl,
      email: profile.email,
      url: profile.canonicalUrl,
      address: {
        '@type': 'PostalAddress',
        addressLocality: profile.locationCity,
        addressCountry: profile.locationCountry,
      },
      sameAs: profile.socialLinks.map((link) => link.url),
      knowsLanguage: ['en', 'vi'],
    };
  }
}
