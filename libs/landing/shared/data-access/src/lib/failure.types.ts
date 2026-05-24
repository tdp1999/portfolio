import type { TranslatableJson } from '@portfolio/shared/types';

export interface PublicAboutFailure {
  id: string;
  order: number;
  year: number;
  context: TranslatableJson;
  decision: TranslatableJson;
  consequence: TranslatableJson;
  lesson: TranslatableJson;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AboutFailuresResponse {
  items: PublicAboutFailure[];
}
