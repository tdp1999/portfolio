export interface TranslatableJson {
  [key: string]: string;
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
  startDate: string;
  endDate: string | null;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  displayOrder: number;
  sourceUrl: string | null;
  projectUrl: string | null;
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
  challenge: TranslatableJson;
  approach: TranslatableJson;
  outcome: TranslatableJson;
  codeUrl?: string | null;
}

export interface CreateProjectPayload {
  title: string;
  oneLiner: TranslatableJson;
  description: TranslatableJson;
  motivation: TranslatableJson;
  role: TranslatableJson;
  startDate: string;
  endDate?: string | null;
  sourceUrl?: string | null;
  projectUrl?: string | null;
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
  startDate?: string;
  endDate?: string | null;
  status?: 'DRAFT' | 'PUBLISHED';
  sourceUrl?: string | null;
  projectUrl?: string | null;
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
