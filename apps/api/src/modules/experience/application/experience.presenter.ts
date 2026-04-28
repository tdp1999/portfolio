import type { ExperienceLink, TranslatableJson, TranslatableStringArray } from '@portfolio/shared/types';
import { Experience } from '../domain/entities/experience.entity';
import type { EmploymentType, LocationType } from '../domain/experience.types';

export interface SkillRef {
  id: string;
  name: TranslatableJson;
  slug: string;
}

export type ExperienceSkillDto = {
  id: string;
  name: TranslatableJson;
  slug: string;
};

export type ExperiencePublicResponseDto = {
  id: string;
  slug: string;
  companyName: string;
  companyUrl: string | null;
  companyLogoUrl: string | null;
  position: TranslatableJson;
  description: TranslatableJson | null;
  responsibilities: TranslatableStringArray;
  highlights: TranslatableStringArray;
  teamRole: TranslatableJson | null;
  links: ExperienceLink[];
  employmentType: EmploymentType;
  locationType: LocationType;
  locationCountry: string;
  locationCity: string | null;
  domain: string | null;
  teamSize: number | null;
  startDate: Date;
  endDate: Date | null;
  skills: ExperienceSkillDto[];
};

export type ExperienceAdminResponseDto = ExperiencePublicResponseDto & {
  clientName: string | null;
  locationPostalCode: string | null;
  locationAddress1: string | null;
  locationAddress2: string | null;
  displayOrder: number;
  companyLogoId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
  deletedAt: Date | null;
  deletedById: string | null;
};

type ExperienceListItem = {
  experience: Experience;
  skills: SkillRef[];
  companyLogoUrl: string | null;
};

export class ExperiencePresenter {
  static toPublicResponse(
    entity: Experience,
    skills: SkillRef[],
    companyLogoUrl: string | null
  ): ExperiencePublicResponseDto {
    return {
      id: entity.id,
      slug: entity.slug,
      companyName: entity.companyName,
      companyUrl: entity.companyUrl,
      companyLogoUrl,
      position: entity.position,
      description: entity.description,
      responsibilities: entity.responsibilities,
      highlights: entity.highlights,
      teamRole: entity.teamRole,
      links: entity.links,
      employmentType: entity.employmentType,
      locationType: entity.locationType,
      locationCountry: entity.locationCountry,
      locationCity: entity.locationCity,
      domain: entity.domain,
      teamSize: entity.teamSize,
      startDate: entity.startDate,
      endDate: entity.endDate,
      skills: skills.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
    };
  }

  static toAdminResponse(
    entity: Experience,
    skills: SkillRef[],
    companyLogoUrl: string | null
  ): ExperienceAdminResponseDto {
    return {
      ...ExperiencePresenter.toPublicResponse(entity, skills, companyLogoUrl),
      clientName: entity.clientName,
      locationPostalCode: entity.locationPostalCode,
      locationAddress1: entity.locationAddress1,
      locationAddress2: entity.locationAddress2,
      displayOrder: entity.displayOrder,
      companyLogoId: entity.companyLogoId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      createdById: entity.createdById,
      updatedById: entity.updatedById,
      deletedAt: entity.deletedAt,
      deletedById: entity.deletedById,
    };
  }

  static toPublicListResponse(items: ExperienceListItem[]): ExperiencePublicResponseDto[] {
    return items.map((item) => ExperiencePresenter.toPublicResponse(item.experience, item.skills, item.companyLogoUrl));
  }

  static toAdminListResponse(
    items: ExperienceListItem[],
    total: number
  ): { data: ExperienceAdminResponseDto[]; total: number } {
    return {
      data: items.map((item) => ExperiencePresenter.toAdminResponse(item.experience, item.skills, item.companyLogoUrl)),
      total,
    };
  }
}
