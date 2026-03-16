import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';

export interface AdminTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface TagsListResponse {
  data: AdminTag[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly api = inject(ApiService);

  list(params: { page: number; limit: number; search?: string }) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.search) queryParams['search'] = params.search;
    return this.api.get<TagsListResponse>('/tags', { params: queryParams });
  }

  create(data: { name: string }) {
    return this.api.post<{ id: string }>('/tags', data);
  }

  update(id: string, data: { name: string }) {
    return this.api.patch<{ success: boolean }>(`/tags/${id}`, data);
  }

  delete(id: string) {
    return this.api.delete<{ success: boolean }>(`/tags/${id}`);
  }
}
