import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';

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

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);

  list(params: {
    page: number;
    limit: number;
    search?: string;
    includeDeleted?: boolean;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.search) queryParams['search'] = params.search;
    if (params.includeDeleted) queryParams['includeDeleted'] = 'true';
    if (params.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params.sortDir) queryParams['sortDir'] = params.sortDir;
    return this.api.get<CategoriesListResponse>('/categories', { params: queryParams });
  }

  create(data: CreateCategoryPayload) {
    return this.api.post<{ id: string }>('/categories', data);
  }

  update(id: string, data: UpdateCategoryPayload) {
    return this.api.patch<{ success: boolean }>(`/categories/${id}`, data);
  }

  delete(id: string) {
    return this.api.delete<{ success: boolean }>(`/categories/${id}`);
  }
}
