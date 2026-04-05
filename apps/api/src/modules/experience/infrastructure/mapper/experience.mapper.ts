import { Prisma, Experience as PrismaExperience, ExperienceSkill } from '@prisma/client';
import { TranslatableJson, TranslatableStringArray } from '@portfolio/shared/types';
import { Experience } from '../../domain/entities/experience.entity';
import { IExperienceProps, EmploymentType, LocationType } from '../../domain/experience.types';

type PrismaExperienceWithRelations = PrismaExperience & {
  skills: ExperienceSkill[];
};

export class ExperienceMapper {
  static toDomain(raw: PrismaExperienceWithRelations): Experience {
    const props: IExperienceProps = {
      id: raw.id,
      slug: raw.slug,
      companyName: raw.companyName,
      companyUrl: raw.companyUrl,
      companyLogoId: raw.companyLogoId,
      position: raw.position as unknown as TranslatableJson,
      description: raw.description as unknown as TranslatableJson | null,
      achievements: raw.achievements as unknown as TranslatableStringArray,
      teamRole: raw.teamRole as unknown as TranslatableJson | null,
      employmentType: raw.employmentType as EmploymentType,
      locationType: raw.locationType as LocationType,
      locationCountry: raw.locationCountry,
      locationCity: raw.locationCity,
      locationPostalCode: raw.locationPostalCode,
      locationAddress1: raw.locationAddress1,
      locationAddress2: raw.locationAddress2,
      clientName: raw.clientName,
      clientIndustry: raw.clientIndustry,
      domain: raw.domain,
      teamSize: raw.teamSize,
      startDate: raw.startDate,
      endDate: raw.endDate,
      displayOrder: raw.displayOrder,
      skillIds: raw.skills.map((s) => s.skillId),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdById: raw.createdById,
      updatedById: raw.updatedById,
      deletedAt: raw.deletedAt,
      deletedById: raw.deletedById,
    };
    return Experience.load(props);
  }

  static toPrisma(entity: Experience): Prisma.ExperienceUncheckedCreateInput {
    return {
      id: entity.id,
      slug: entity.slug,
      companyName: entity.companyName,
      companyUrl: entity.companyUrl,
      companyLogoId: entity.companyLogoId,
      position: entity.position as unknown as Prisma.InputJsonValue,
      description:
        entity.description !== null ? (entity.description as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      achievements: entity.achievements as unknown as Prisma.InputJsonValue,
      teamRole: entity.teamRole !== null ? (entity.teamRole as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      employmentType: entity.employmentType,
      locationType: entity.locationType,
      locationCountry: entity.locationCountry,
      locationCity: entity.locationCity,
      locationPostalCode: entity.locationPostalCode,
      locationAddress1: entity.locationAddress1,
      locationAddress2: entity.locationAddress2,
      clientName: entity.clientName,
      clientIndustry: entity.clientIndustry,
      domain: entity.domain,
      teamSize: entity.teamSize,
      startDate: entity.startDate,
      endDate: entity.endDate,
      displayOrder: entity.displayOrder,
      createdById: entity.createdById,
      updatedById: entity.updatedById,
      deletedAt: entity.deletedAt,
      deletedById: entity.deletedById,
    };
  }
}
