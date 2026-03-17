import { IBaseAuditProps } from '@portfolio/shared/types';

export interface ICategoryProps extends IBaseAuditProps {
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
}

export interface ICreateCategoryPayload {
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface IUpdateCategoryPayload {
  name?: string;
  description?: string | null;
  displayOrder?: number;
}
