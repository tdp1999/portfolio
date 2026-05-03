import { IBaseAuditProps, TranslatableJson } from '@portfolio/shared/types';
import type { ProjectLinkProps } from './value-objects';

export const CONTENT_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;

export type ContentStatus = (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

export interface IProjectProps extends IBaseAuditProps {
  slug: string;
  title: string;

  // Translatable
  oneLiner: TranslatableJson;
  description: TranslatableJson;
  motivation: TranslatableJson;
  role: TranslatableJson;

  // Long-form case-study body — translatable, optional
  body: TranslatableJson | null;

  // Dates
  startDate: Date;
  endDate: Date | null;

  // Status & Display
  status: ContentStatus;
  featured: boolean;
  displayOrder: number;

  // External links (replaces sourceUrl/projectUrl)
  links: ProjectLinkProps[];

  // Media
  thumbnailId: string | null;
}

export interface ICreateProjectPayload {
  title: string;
  oneLiner: TranslatableJson;
  description: TranslatableJson;
  motivation: TranslatableJson;
  role: TranslatableJson;
  body?: TranslatableJson | null;
  startDate: Date;
  endDate?: Date;
  links?: ProjectLinkProps[];
  thumbnailId?: string;
  featured?: boolean;
  displayOrder?: number;
}

export interface IUpdateProjectPayload {
  title?: string;
  oneLiner?: TranslatableJson;
  description?: TranslatableJson;
  motivation?: TranslatableJson;
  role?: TranslatableJson;
  body?: TranslatableJson | null;
  startDate?: Date;
  endDate?: Date | null;
  status?: ContentStatus;
  links?: ProjectLinkProps[];
  thumbnailId?: string | null;
  featured?: boolean;
  displayOrder?: number;
}
