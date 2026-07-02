import { Prisma, Experience as PrismaExperience, ExperienceSkill } from '@prisma/client';
import { ExperienceLink, TranslatableJson, TranslatableRichText } from '@portfolio/shared/types';
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
      teamRole: raw.teamRole as unknown as TranslatableJson | null,
      // Rich-text columns — opaque passthrough on the read side.
      descriptionJson: (raw.descriptionJson as TranslatableRichText | null) ?? null,
      descriptionHtml: (raw.descriptionHtml as unknown as TranslatableJson | null) ?? null,
      descriptionSchemaVersion: raw.descriptionSchemaVersion,
      descriptionCanonical: (raw.descriptionCanonical as unknown as TranslatableJson | null) ?? null,
      responsibilitiesJson: (raw.responsibilitiesJson as TranslatableRichText | null) ?? null,
      responsibilitiesHtml: (raw.responsibilitiesHtml as unknown as TranslatableJson | null) ?? null,
      responsibilitiesSchemaVersion: raw.responsibilitiesSchemaVersion,
      responsibilitiesCanonical: (raw.responsibilitiesCanonical as unknown as TranslatableJson | null) ?? null,
      highlightsJson: (raw.highlightsJson as TranslatableRichText | null) ?? null,
      highlightsHtml: (raw.highlightsHtml as unknown as TranslatableJson | null) ?? null,
      highlightsSchemaVersion: raw.highlightsSchemaVersion,
      highlightsCanonical: (raw.highlightsCanonical as unknown as TranslatableJson | null) ?? null,
      links: raw.links as unknown as ExperienceLink[],
      employmentType: raw.employmentType as EmploymentType,
      locationType: raw.locationType as LocationType,
      locationCountry: raw.locationCountry,
      locationCity: raw.locationCity,
      locationPostalCode: raw.locationPostalCode,
      locationAddress1: raw.locationAddress1,
      locationAddress2: raw.locationAddress2,
      clientName: raw.clientName,
      domain: raw.domain,
      teamSizeMin: raw.teamSizeMin,
      teamSizeMax: raw.teamSizeMax,
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
      descriptionJson: (entity.descriptionJson as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      descriptionHtml: (entity.descriptionHtml as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      descriptionSchemaVersion: entity.descriptionSchemaVersion,
      descriptionCanonical: (entity.descriptionCanonical as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      responsibilitiesJson: (entity.responsibilitiesJson as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      responsibilitiesHtml: (entity.responsibilitiesHtml as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      responsibilitiesSchemaVersion: entity.responsibilitiesSchemaVersion,
      responsibilitiesCanonical:
        (entity.responsibilitiesCanonical as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      highlightsJson: (entity.highlightsJson as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      highlightsHtml: (entity.highlightsHtml as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      highlightsSchemaVersion: entity.highlightsSchemaVersion,
      highlightsCanonical: (entity.highlightsCanonical as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      teamRole: entity.teamRole !== null ? (entity.teamRole as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
      links: entity.links as unknown as Prisma.InputJsonValue,
      employmentType: entity.employmentType,
      locationType: entity.locationType,
      locationCountry: entity.locationCountry,
      locationCity: entity.locationCity,
      locationPostalCode: entity.locationPostalCode,
      locationAddress1: entity.locationAddress1,
      locationAddress2: entity.locationAddress2,
      clientName: entity.clientName,
      domain: entity.domain,
      teamSizeMin: entity.teamSizeMin,
      teamSizeMax: entity.teamSizeMax,
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
