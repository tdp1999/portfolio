import type { MediaRefMap } from '@portfolio/shared/features/rte-core/image-refs';
import type { TranslatableJson, TranslatableRichText } from '@portfolio/shared/types';
import { Project } from '../domain/entities/project.entity';
import type { ProjectLinkProps } from '../domain/value-objects';
import type { ProjectLifecycleStatus } from '../domain/project.types';
import type {
  ProjectHighlightDto,
  ProjectImageDto,
  ProjectSkillDto,
  ProjectRelations,
} from '../infrastructure/mapper/project.mapper';

// --- Response types ---

export type ProjectListItemDto = {
  slug: string;
  title: string;
  oneLiner: TranslatableJson;
  startDate: Date;
  endDate: Date | null;
  thumbnailUrl: string | null;
  skills: { name: string; slug: string; category: string }[];
  featured: boolean;
  lifecycleStatus: ProjectLifecycleStatus;
};

export type ProjectHighlightResponseDto = {
  // Optional short bilingual label.
  title: TranslatableJson | null;
  // Rich-text storage per CAO sub-field.
  challengeJson: TranslatableRichText | null;
  challengeHtml: TranslatableJson | null;
  challengeSchemaVersion: number;
  challengeCanonical: TranslatableJson | null;
  approachJson: TranslatableRichText | null;
  approachHtml: TranslatableJson | null;
  approachSchemaVersion: number;
  approachCanonical: TranslatableJson | null;
  outcomeJson: TranslatableRichText | null;
  outcomeHtml: TranslatableJson | null;
  outcomeSchemaVersion: number;
  outcomeCanonical: TranslatableJson | null;
  codeUrl: string | null;
};

export type ProjectImageResponseDto = {
  url: string;
  alt: string | null;
};

export type ProjectDetailDto = {
  slug: string;
  title: string;
  oneLiner: TranslatableJson;
  description: TranslatableJson;
  motivation: TranslatableJson;
  role: TranslatableJson;
  /** Rich-text storage for `body`. */
  bodyJson: TranslatableRichText | null;
  bodyHtml: TranslatableJson | null;
  /** Canonical `PortableDocument` per locale (prose-block renderer epic) — the AST
   *  render source. Null until the body is (re)saved through the editor; the landing
   *  read-path falls back to `bodyHtml` when null. */
  bodyCanonical: TranslatableJson | null;
  bodySchemaVersion: number;
  /** Resolved media for the `image-ref` blocks in `bodyHtml`, keyed by
   *  `data-image-id` (RTE epic Phase 7, task 315). Locale-independent; empty when
   *  the body references no media. The landing renderer injects `<img>` from this. */
  mediaRefs: MediaRefMap;
  startDate: Date;
  endDate: Date | null;
  links: ProjectLinkProps[];
  thumbnailUrl: string | null;
  featured: boolean;
  lifecycleStatus: ProjectLifecycleStatus;
  highlights: ProjectHighlightResponseDto[];
  images: ProjectImageResponseDto[];
  skills: { name: string; slug: string; category: string }[];
};

export type ProjectAdminResponseDto = Omit<ProjectDetailDto, 'highlights' | 'images' | 'skills'> & {
  id: string;
  status: string;
  displayOrder: number;
  thumbnailId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  updatedById: string;
  deletedAt: Date | null;
  deletedById: string | null;
  highlights: ProjectHighlightDto[];
  images: ProjectImageDto[];
  skills: ProjectSkillDto[];
};

// --- Presenter ---

type ProjectWithRelations = {
  entity: Project;
  relations: ProjectRelations;
  thumbnailUrl: string | null;
};

export class ProjectPresenter {
  static toListItem(item: ProjectWithRelations): ProjectListItemDto {
    return {
      slug: item.entity.slug,
      title: item.entity.title,
      oneLiner: item.entity.oneLiner,
      startDate: item.entity.startDate,
      endDate: item.entity.endDate,
      thumbnailUrl: item.thumbnailUrl,
      skills: item.relations.skills.map((s) => ({ name: s.name, slug: s.slug, category: s.category })),
      featured: item.entity.featured,
      lifecycleStatus: item.entity.lifecycleStatus,
    };
  }

  static toDetail(item: ProjectWithRelations, mediaRefs: MediaRefMap = {}): ProjectDetailDto {
    return {
      slug: item.entity.slug,
      title: item.entity.title,
      oneLiner: item.entity.oneLiner,
      description: item.entity.description,
      motivation: item.entity.motivation,
      role: item.entity.role,
      bodyJson: item.entity.bodyJson,
      bodyHtml: item.entity.bodyHtml,
      bodyCanonical: item.entity.bodyCanonical,
      bodySchemaVersion: item.entity.bodySchemaVersion,
      mediaRefs,
      startDate: item.entity.startDate,
      endDate: item.entity.endDate,
      links: item.entity.links,
      thumbnailUrl: item.thumbnailUrl,
      featured: item.entity.featured,
      lifecycleStatus: item.entity.lifecycleStatus,
      highlights: item.relations.highlights.map((h) => ({
        title: h.title,
        challengeJson: h.challengeJson,
        challengeHtml: h.challengeHtml,
        challengeSchemaVersion: h.challengeSchemaVersion,
        challengeCanonical: h.challengeCanonical,
        approachJson: h.approachJson,
        approachHtml: h.approachHtml,
        approachSchemaVersion: h.approachSchemaVersion,
        approachCanonical: h.approachCanonical,
        outcomeJson: h.outcomeJson,
        outcomeHtml: h.outcomeHtml,
        outcomeSchemaVersion: h.outcomeSchemaVersion,
        outcomeCanonical: h.outcomeCanonical,
        codeUrl: h.codeUrl,
      })),
      images: item.relations.images.map((i) => ({
        url: i.url,
        alt: i.altText,
      })),
      skills: item.relations.skills.map((s) => ({ name: s.name, slug: s.slug, category: s.category })),
    };
  }

  static toAdminResponse(item: ProjectWithRelations): ProjectAdminResponseDto {
    return {
      ...ProjectPresenter.toDetail(item),
      id: item.entity.id,
      status: item.entity.status,
      displayOrder: item.entity.displayOrder,
      thumbnailId: item.entity.thumbnailId,
      createdAt: item.entity.createdAt,
      updatedAt: item.entity.updatedAt,
      createdById: item.entity.createdById,
      updatedById: item.entity.updatedById,
      deletedAt: item.entity.deletedAt,
      deletedById: item.entity.deletedById,
      highlights: item.relations.highlights,
      images: item.relations.images,
      skills: item.relations.skills,
    };
  }
}
