import type { HealthProfileDto, MedicalItemDto } from '@portfolio/shared/types';

export interface MedicalItemsListResponse {
  data: MedicalItemDto[];
  total: number;
  page: number;
  limit: number;
}

export type MedicalItemPayload = Partial<Omit<MedicalItemDto, 'id' | 'createdAt' | 'updatedAt'>>;

export type { HealthProfileDto, MedicalItemDto };
