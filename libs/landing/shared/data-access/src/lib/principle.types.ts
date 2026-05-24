import type { TranslatableJson } from '@portfolio/shared/types';

export interface PublicAboutPrinciple {
  id: string;
  order: number;
  claim: TranslatableJson;
  expansion: TranslatableJson;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AboutPrinciplesResponse {
  items: PublicAboutPrinciple[];
}
