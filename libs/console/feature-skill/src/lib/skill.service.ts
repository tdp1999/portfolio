import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';

export interface AdminSkill {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  isLibrary: boolean;
  parentSkillId: string | null;
  yearsOfExperience: number | null;
  iconId: string | null;
  iconUrl: string | null;
  proficiencyNote: string | null;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SkillsListResponse {
  data: AdminSkill[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateSkillPayload {
  name: string;
  category: string;
  description?: string;
  isLibrary?: boolean;
  parentSkillId?: string;
  yearsOfExperience?: number;
  iconId?: string;
  proficiencyNote?: string;
  isFeatured?: boolean;
  displayOrder?: number;
}

export interface UpdateSkillPayload {
  name?: string;
  category?: string;
  description?: string | null;
  isLibrary?: boolean;
  parentSkillId?: string | null;
  yearsOfExperience?: number | null;
  iconId?: string | null;
  proficiencyNote?: string | null;
  isFeatured?: boolean;
  displayOrder?: number;
}

@Injectable({ providedIn: 'root' })
export class SkillService {
  private readonly api = inject(ApiService);

  list(params: { page: number; limit: number; search?: string; category?: string }) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.search) queryParams['search'] = params.search;
    if (params.category) queryParams['category'] = params.category;
    return this.api.get<SkillsListResponse>('/skills', { params: queryParams });
  }

  getById(id: string) {
    return this.api.get<AdminSkill>(`/skills/${id}`);
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
