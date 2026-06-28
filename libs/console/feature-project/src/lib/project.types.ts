import type { BilingualEditorDocument } from '@portfolio/console/shared/util';

export interface TranslatableJson {
  [key: string]: string;
}

export const PROJECT_LINK_TYPES = ['repo', 'demo', 'case-study', 'doc', 'post'] as const;
export type ProjectLinkType = (typeof PROJECT_LINK_TYPES)[number];

export interface ProjectLink {
  label: string;
  url: string;
  type: ProjectLinkType;
}

// --- Admin response types (from ProjectPresenter.toAdminResponse) ---

export interface AdminProject {
  id: string;
  slug: string;
  title: string;
  oneLiner: TranslatableJson;
  description: TranslatableJson;
  motivation: TranslatableJson;
  role: TranslatableJson;
  body: TranslatableJson | null;
  /** RTE canonical doc for the long-form body (full mode). Null until saved via the editor. */
  bodyJson: BilingualEditorDocument | null;
  startDate: string;
  endDate: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  displayOrder: number;
  links: ProjectLink[];
  thumbnailId: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string;
  deletedAt: string | null;
  deletedById: string | null;
  highlights: AdminHighlight[];
  images: AdminImage[];
  skills: AdminProjectSkill[];
}

export interface AdminHighlight {
  id: string;
  challenge: TranslatableJson;
  approach: TranslatableJson;
  outcome: TranslatableJson;
  /** RTE canonical docs (semantic mode). Null until saved via the editor. */
  challengeJson: BilingualEditorDocument | null;
  approachJson: BilingualEditorDocument | null;
  outcomeJson: BilingualEditorDocument | null;
  codeUrl: string | null;
  displayOrder: number;
}

export interface AdminImage {
  id: string;
  mediaId: string;
  url: string;
  altText: string | null;
  displayOrder: number;
}

export interface AdminProjectSkill {
  id: string;
  name: string;
  slug: string;
}

// --- List response ---

export interface ProjectListResponse {
  data: AdminProject[];
  total: number;
  page: number;
  limit: number;
}

// --- Payloads ---

export interface HighlightPayload {
  // Legacy markdown — optional during the RTE transition; the editor now emits the
  // `*Json` docs below as the source of truth (landing render swap: task 313).
  challenge?: TranslatableJson;
  approach?: TranslatableJson;
  outcome?: TranslatableJson;
  challengeJson?: BilingualEditorDocument;
  approachJson?: BilingualEditorDocument;
  outcomeJson?: BilingualEditorDocument;
  codeUrl?: string | null;
}

export interface CreateProjectPayload {
  title: string;
  oneLiner: TranslatableJson;
  description: TranslatableJson;
  motivation: TranslatableJson;
  role: TranslatableJson;
  body?: TranslatableJson | null;
  bodyJson?: BilingualEditorDocument;
  startDate: string;
  endDate?: string | null;
  links?: ProjectLink[];
  thumbnailId?: string | null;
  featured?: boolean;
  displayOrder?: number;
  skillIds?: string[];
  imageIds?: string[];
  highlights?: HighlightPayload[];
}

export interface UpdateProjectPayload {
  title?: string;
  oneLiner?: TranslatableJson;
  description?: TranslatableJson;
  motivation?: TranslatableJson;
  role?: TranslatableJson;
  body?: TranslatableJson | null;
  bodyJson?: BilingualEditorDocument;
  startDate?: string;
  endDate?: string | null;
  status?: 'DRAFT' | 'PUBLISHED';
  links?: ProjectLink[];
  thumbnailId?: string | null;
  featured?: boolean;
  displayOrder?: number;
  skillIds?: string[];
  imageIds?: string[];
  highlights?: HighlightPayload[];
}

export interface ReorderPayload {
  id: string;
  displayOrder: number;
}

// --- Skill list (for multi-select) ---

export interface SkillOption {
  id: string;
  name: string;
  slug: string;
  category: string;
}
