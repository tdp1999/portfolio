import {
  Prisma,
  Project as PrismaProject,
  TechnicalHighlight,
  ProjectImage,
  ProjectSkill,
  Media,
  Skill,
} from '@prisma/client';
import { TranslatableJson, TranslatableRichText } from '@portfolio/shared/types';
import { Project } from '../../domain/entities/project.entity';
import { IProjectProps, ContentStatus, ProjectLifecycleStatus } from '../../domain/project.types';
import { ProjectLinkProps, PROJECT_LINK_TYPES, ProjectLinkType } from '../../domain/value-objects';

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
  // Rich-text storage per CAO sub-field (RTE epic Phase 2). Null until Phase 4.
  challengeJson: TranslatableRichText | null;
  challengeHtml: TranslatableJson | null;
  challengeSchemaVersion: number;
  approachJson: TranslatableRichText | null;
  approachHtml: TranslatableJson | null;
  approachSchemaVersion: number;
  outcomeJson: TranslatableRichText | null;
  outcomeHtml: TranslatableJson | null;
  outcomeSchemaVersion: number;
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
  category: string;
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

const isLinkType = (v: unknown): v is ProjectLinkType =>
  typeof v === 'string' && (PROJECT_LINK_TYPES as readonly string[]).includes(v);

const parseLinks = (raw: unknown): ProjectLinkProps[] => {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (l): l is { label: string; url: string; type: string } =>
        l != null &&
        typeof l === 'object' &&
        typeof (l as { label?: unknown }).label === 'string' &&
        typeof (l as { url?: unknown }).url === 'string' &&
        typeof (l as { type?: unknown }).type === 'string'
    )
    .filter((l) => isLinkType(l.type))
    .map((l) => ({ label: l.label, url: l.url, type: l.type as ProjectLinkType }));
};

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
      body: raw.body == null ? null : (raw.body as unknown as TranslatableJson),
      // Rich-text columns — opaque passthrough (read side); write path is Phase 4.
      bodyJson: (raw.bodyJson as TranslatableRichText | null) ?? null,
      bodyHtml: (raw.bodyHtml as unknown as TranslatableJson | null) ?? null,
      bodySchemaVersion: raw.bodySchemaVersion,
      startDate: raw.startDate,
      endDate: raw.endDate,
      status: raw.status as ContentStatus,
      lifecycleStatus: raw.lifecycleStatus as ProjectLifecycleStatus,
      featured: raw.featured,
      displayOrder: raw.displayOrder,
      links: parseLinks(raw.links),
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
          challengeJson: (h.challengeJson as TranslatableRichText | null) ?? null,
          challengeHtml: (h.challengeHtml as unknown as TranslatableJson | null) ?? null,
          challengeSchemaVersion: h.challengeSchemaVersion,
          approachJson: (h.approachJson as TranslatableRichText | null) ?? null,
          approachHtml: (h.approachHtml as unknown as TranslatableJson | null) ?? null,
          approachSchemaVersion: h.approachSchemaVersion,
          outcomeJson: (h.outcomeJson as TranslatableRichText | null) ?? null,
          outcomeHtml: (h.outcomeHtml as unknown as TranslatableJson | null) ?? null,
          outcomeSchemaVersion: h.outcomeSchemaVersion,
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
        category: s.skill.category,
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
      body: (entity.body as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      bodyJson: (entity.bodyJson as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      bodyHtml: (entity.bodyHtml as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
      bodySchemaVersion: entity.bodySchemaVersion,
      startDate: entity.startDate,
      endDate: entity.endDate,
      status: entity.status,
      lifecycleStatus: entity.lifecycleStatus,
      featured: entity.featured,
      displayOrder: entity.displayOrder,
      links: entity.links as unknown as Prisma.InputJsonValue,
      thumbnailId: entity.thumbnailId,
      createdById: entity.createdById,
      updatedById: entity.updatedById,
      deletedAt: entity.deletedAt,
      deletedById: entity.deletedById,
    };
  }
}
