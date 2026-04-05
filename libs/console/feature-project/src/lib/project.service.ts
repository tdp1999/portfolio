import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';
import {
  AdminProject,
  CreateProjectPayload,
  ProjectListResponse,
  ReorderPayload,
  SkillOption,
  UpdateProjectPayload,
} from './project.types';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly api = inject(ApiService);

  list(params: { page: number; limit: number; status?: string; includeDeleted?: boolean; search?: string }) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.status) queryParams['status'] = params.status;
    if (params.includeDeleted) queryParams['includeDeleted'] = 'true';
    if (params.search) queryParams['search'] = params.search;
    return this.api.get<ProjectListResponse>('/projects/admin/list', { params: queryParams });
  }

  getById(id: string) {
    return this.api.get<AdminProject>(`/projects/${id}`);
  }

  create(data: CreateProjectPayload) {
    return this.api.post<{ id: string }>('/projects', data);
  }

  update(id: string, data: UpdateProjectPayload) {
    return this.api.put<{ success: boolean }>(`/projects/${id}`, data);
  }

  delete(id: string) {
    return this.api.delete<{ success: boolean }>(`/projects/${id}`);
  }

  restore(id: string) {
    return this.api.patch<{ success: boolean }>(`/projects/${id}/restore`, {});
  }

  reorder(items: ReorderPayload[]) {
    return this.api.patch<{ success: boolean }>('/projects/reorder', items);
  }

  listSkills() {
    return this.api.get<SkillOption[]>('/skills/all');
  }
}
