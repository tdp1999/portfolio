import type { TranslatableJson } from '@portfolio/shared/types';

export interface IAboutFailureProps {
  id: string;
  order: number;
  year: number;
  context: TranslatableJson;
  decision: TranslatableJson;
  consequence: TranslatableJson;
  lesson: TranslatableJson;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateAboutFailurePayload {
  order?: number;
  year: number;
  context: TranslatableJson;
  decision: TranslatableJson;
  consequence: TranslatableJson;
  lesson: TranslatableJson;
  isPublished?: boolean;
}

export interface IUpdateAboutFailurePayload {
  order?: number;
  year?: number;
  context?: TranslatableJson;
  decision?: TranslatableJson;
  consequence?: TranslatableJson;
  lesson?: TranslatableJson;
  isPublished?: boolean;
}

export const ABOUT_FAILURE_LIMITS = {
  CONTEXT_MAX: 200,
  NARRATIVE_MAX: 1500,
  YEAR_MIN: 2000,
} as const;
