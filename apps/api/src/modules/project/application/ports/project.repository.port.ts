import { PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';
import { Project } from '../../domain/entities/project.entity';
import { ProjectReadResult } from '../../infrastructure/mapper/project.mapper';

export interface TechnicalHighlightInput {
  challenge: { en: string; vi: string };
  approach: { en: string; vi: string };
  outcome: { en: string; vi: string };
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
