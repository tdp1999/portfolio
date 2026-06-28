import { PaginatedQuery, PaginatedResult, TranslatableJson, TranslatableRichText } from '@portfolio/shared/types';
import { Project } from '../../domain/entities/project.entity';
import { ProjectReadResult } from '../../infrastructure/mapper/project.mapper';

/** Canonical rich-text triple written to the `*Json`/`*Html`/`*SchemaVersion` columns. */
export interface RichFieldTriple {
  json: TranslatableRichText;
  html: TranslatableJson;
  schemaVersion: number;
}

export interface TechnicalHighlightInput {
  // Legacy markdown (kept for the transition; empty when the editor only emits RTE).
  challenge: { en: string; vi: string };
  approach: { en: string; vi: string };
  outcome: { en: string; vi: string };
  // RTE triples (source of truth). Null when the field had no authored content.
  challengeRich?: RichFieldTriple | null;
  approachRich?: RichFieldTriple | null;
  outcomeRich?: RichFieldTriple | null;
  codeUrl?: string | null;
  displayOrder: number;
}

export interface ProjectCreateInput {
  entity: Project;
  highlights: TechnicalHighlightInput[];
  imageIds: string[];
  skillIds: string[];
}

export interface ProjectUpdateInput {
  entity: Project;
  highlights: TechnicalHighlightInput[];
  imageIds: string[];
  skillIds: string[];
}

export interface ProjectFindAllOptions extends PaginatedQuery {
  status?: string;
  sortBy?: string;
}

export interface IProjectRepository {
  create(input: ProjectCreateInput): Promise<string>;
  update(id: string, input: ProjectUpdateInput): Promise<void>;
  findById(id: string): Promise<ProjectReadResult | null>;
  findByIdIncludeDeleted(id: string): Promise<ProjectReadResult | null>;
  findBySlug(slug: string): Promise<ProjectReadResult | null>;
  findAll(options: ProjectFindAllOptions): Promise<PaginatedResult<ProjectReadResult>>;
  findPublished(): Promise<ProjectReadResult[]>;
  findFeatured(): Promise<ProjectReadResult[]>;
  softDelete(id: string, entity: Project): Promise<void>;
  restore(id: string, entity: Project): Promise<void>;
  slugExists(slug: string, excludeId?: string): Promise<boolean>;
  batchUpdateOrder(items: { id: string; displayOrder: number }[]): Promise<void>;
}
