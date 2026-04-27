export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CategoriesListResponse {
  data: AdminCategory[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateCategoryPayload {
  name?: string;
  description?: string | null;
  displayOrder?: number;
}
