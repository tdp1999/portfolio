import type { TranslatableJson } from '@portfolio/shared/types';

export interface IAboutPrincipleProps {
  id: string;
  order: number;
  claim: TranslatableJson;
  expansion: TranslatableJson;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateAboutPrinciplePayload {
  order?: number;
  claim: TranslatableJson;
  expansion: TranslatableJson;
  isPublished?: boolean;
}

export interface IUpdateAboutPrinciplePayload {
  order?: number;
  claim?: TranslatableJson;
  expansion?: TranslatableJson;
  isPublished?: boolean;
}
