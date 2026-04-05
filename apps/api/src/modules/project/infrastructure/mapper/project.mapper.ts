import {
  Prisma,
  Project as PrismaProject,
  TechnicalHighlight,
  ProjectImage,
  ProjectSkill,
  Media,
  Skill,
} from '@prisma/client';
import { TranslatableJson } from '@portfolio/shared/types';
import { Project } from '../../domain/entities/project.entity';
import { IProjectProps, ContentStatus } from '../../domain/project.types';

export type PrismaProjectWithRelations = PrismaProject & {
  highlights: TechnicalHighlight[];
  images: (ProjectImage & { media: Media })[];
  skills: (ProjectSkill & { skill: Skill })[];
  thumbnail: Media | null;
};

export interface ProjectHighlightDto {
  id: string;
  challenge: TranslatableJson;
  approach: TranslatableJson;
  outcome: TranslatableJson;
  codeUrl: string | null;
  displayOrder: number;
}

export interface ProjectImageDto {
  id: string;
  mediaId: string;
  url: string;
  altText: string | null;
  displayOrder: number;
}

export interface ProjectSkillDto {
  id: string;
  name: string;
  slug: string;
}

export interface ProjectRelations {
  highlights: ProjectHighlightDto[];
  images: ProjectImageDto[];
  skills: ProjectSkillDto[];
}

export interface ProjectReadResult {
  entity: Project;
  relations: ProjectRelations;
  thumbnailUrl: string | null;
}

export class ProjectMapper {
  static toDomain(raw: PrismaProjectWithRelations): Project {
    const props: IProjectProps = {
      id: raw.id,
      slug: raw.slug,
      title: raw.title,
      oneLiner: raw.oneLiner as unknown as TranslatableJson,
      description: raw.description as unknown as TranslatableJson,
      motivation: raw.motivation as unknown as TranslatableJson,
      role: raw.role as unknown as TranslatableJson,
      startDate: raw.startDate,
      endDate: raw.endDate,
      status: raw.status as ContentStatus,
      featured: raw.featured,
      displayOrder: raw.displayOrder,
      sourceUrl: raw.sourceUrl,
      projectUrl: raw.projectUrl,
      thumbnailId: raw.thumbnailId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdById: raw.createdById,
      updatedById: raw.updatedById,
      deletedAt: raw.deletedAt,
      deletedById: raw.deletedById,
    };
    return Project.load(props);
  }

  static toRelations(raw: PrismaProjectWithRelations): ProjectRelations {
    return {
      highlights: raw.highlights
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((h) => ({
          id: h.id,
          challenge: h.challenge as unknown as TranslatableJson,
          approach: h.approach as unknown as TranslatableJson,
          outcome: h.outcome as unknown as TranslatableJson,
          codeUrl: h.codeUrl,
          displayOrder: h.displayOrder,
        })),
      images: raw.images
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((i) => ({
          id: i.id,
          mediaId: i.mediaId,
          url: i.media.url,
          altText: i.media.altText,
          displayOrder: i.displayOrder,
        })),
      skills: raw.skills.map((s) => ({
        id: s.skill.id,
        name: s.skill.name,
        slug: s.skill.slug,
      })),
    };
  }

  static toReadResult(raw: PrismaProjectWithRelations): ProjectReadResult {
    return {
      entity: ProjectMapper.toDomain(raw),
      relations: ProjectMapper.toRelations(raw),
      thumbnailUrl: raw.thumbnail?.url ?? null,
    };
  }

  static toPrisma(entity: Project): Prisma.ProjectUncheckedCreateInput {
    return {
      id: entity.id,
      slug: entity.slug,
      title: entity.title,
      oneLiner: entity.oneLiner as unknown as Prisma.InputJsonValue,
      description: entity.description as unknown as Prisma.InputJsonValue,
      motivation: entity.motivation as unknown as Prisma.InputJsonValue,
      role: entity.role as unknown as Prisma.InputJsonValue,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      featured: entity.featured,
      displayOrder: entity.displayOrder,
      sourceUrl: entity.sourceUrl,
      projectUrl: entity.projectUrl,
      thumbnailId: entity.thumbnailId,
      createdById: entity.createdById,
      updatedById: entity.updatedById,
      deletedAt: entity.deletedAt,
      deletedById: entity.deletedById,
    };
  }
}
