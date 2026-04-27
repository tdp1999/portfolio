import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';
import { AdminCategory, CategoriesListResponse, CreateCategoryPayload, UpdateCategoryPayload } from './category.types';

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

  getById(id: string) {
    return this.api.get<AdminCategory>(`/categories/${id}`);
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
