import { IBaseAuditProps, TranslatableJson } from '@portfolio/shared/types';

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

  // Dates
  startDate: Date;
  endDate: Date | null;

  // Status & Display
  status: ContentStatus;
  featured: boolean;
  displayOrder: number;

  // Links
  sourceUrl: string | null;
  projectUrl: string | null;

  // Media
  thumbnailId: string | null;
}

export interface ICreateProjectPayload {
  title: string;
  oneLiner: TranslatableJson;
  description: TranslatableJson;
  motivation: TranslatableJson;
  role: TranslatableJson;
  startDate: Date;
  endDate?: Date;
  sourceUrl?: string;
  projectUrl?: string;
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
  startDate?: Date;
  endDate?: Date | null;
  status?: ContentStatus;
  sourceUrl?: string | null;
  projectUrl?: string | null;
  thumbnailId?: string | null;
  featured?: boolean;
  displayOrder?: number;
}
