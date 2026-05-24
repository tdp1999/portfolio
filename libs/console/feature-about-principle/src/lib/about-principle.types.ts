export interface TranslatableText {
  en: string;
  vi: string;
}

export interface AdminAboutPrinciple {
  id: string;
  order: number;
  claim: TranslatableText;
  expansion: TranslatableText;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AboutPrincipleListResponse {
  items: AdminAboutPrinciple[];
}

export interface CreateAboutPrinciplePayload {
  order?: number;
  claim: TranslatableText;
  expansion: TranslatableText;
  isPublished?: boolean;
}

export interface UpdateAboutPrinciplePayload {
  order?: number;
  claim?: TranslatableText;
  expansion?: TranslatableText;
  isPublished?: boolean;
}

export interface ReorderAboutPrinciplesPayload {
  ids: string[];
}

export const ABOUT_PRINCIPLE_LIMITS = {
  CLAIM_MAX: 200,
  EXPANSION_MAX: 1500,
} as const;
