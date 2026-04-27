import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';
import { AdminSkill, CreateSkillPayload, SkillsListResponse, UpdateSkillPayload } from './skill.types';

@Injectable({ providedIn: 'root' })
export class SkillService {
  private readonly api = inject(ApiService);

  list(params: {
    page: number;
    limit: number;
    search?: string;
    category?: string;
    includeDeleted?: boolean;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.search) queryParams['search'] = params.search;
    if (params.category) queryParams['category'] = params.category;
    if (params.includeDeleted) queryParams['includeDeleted'] = 'true';
    if (params.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params.sortDir) queryParams['sortDir'] = params.sortDir;
    return this.api.get<SkillsListResponse>('/skills', { params: queryParams });
  }

  getById(id: string) {
    return this.api.get<AdminSkill>(`/skills/${id}`);
  }

  getChildren(id: string) {
    return this.api.get<AdminSkill[]>(`/skills/${id}/children`);
  }

  listAll() {
    return this.api.get<AdminSkill[]>('/skills/all');
  }

  create(data: CreateSkillPayload) {
    return this.api.post<{ id: string }>('/skills', data);
  }

  update(id: string, data: UpdateSkillPayload) {
    return this.api.patch<{ success: boolean }>(`/skills/${id}`, data);
  }

  delete(id: string) {
    return this.api.delete<{ success: boolean }>(`/skills/${id}`);
  }
}
