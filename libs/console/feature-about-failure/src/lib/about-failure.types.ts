export interface TranslatableText {
  en: string;
  vi: string;
}

export interface AdminAboutFailure {
  id: string;
  order: number;
  year: number;
  context: TranslatableText;
  decision: TranslatableText;
  consequence: TranslatableText;
  lesson: TranslatableText;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AboutFailureListResponse {
  items: AdminAboutFailure[];
}

export interface CreateAboutFailurePayload {
  order?: number;
  year: number;
  context: TranslatableText;
  decision: TranslatableText;
  consequence: TranslatableText;
  lesson: TranslatableText;
  isPublished?: boolean;
}

export interface UpdateAboutFailurePayload {
  order?: number;
  year?: number;
  context?: TranslatableText;
  decision?: TranslatableText;
  consequence?: TranslatableText;
  lesson?: TranslatableText;
  isPublished?: boolean;
}

export interface ReorderAboutFailuresPayload {
  ids: string[];
}
