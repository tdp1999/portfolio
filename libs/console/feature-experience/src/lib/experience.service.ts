import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, timeout } from 'rxjs';
import { API_CONFIG, ApiService } from '@portfolio/console/shared/data-access';
import {
  AdminExperience,
  CreateExperiencePayload,
  ExperiencesListResponse,
  SkillOption,
  UpdateExperiencePayload,
} from './experience.types';

@Injectable({ providedIn: 'root' })
export class ExperienceService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  list(params: {
    page: number;
    limit: number;
    search?: string;
    employmentType?: string;
    locationType?: string;
    includeDeleted?: boolean;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  }) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.search) queryParams['search'] = params.search;
    if (params.employmentType) queryParams['employmentType'] = params.employmentType;
    if (params.locationType) queryParams['locationType'] = params.locationType;
    if (params.includeDeleted) queryParams['includeDeleted'] = 'true';
    if (params.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params.sortDir) queryParams['sortDir'] = params.sortDir;
    return this.api.get<ExperiencesListResponse>('/experiences/admin/list', { params: queryParams });
  }

  getById(id: string) {
    return this.api.get<AdminExperience>(`/experiences/${id}`);
  }

  create(data: CreateExperiencePayload) {
    return this.api.post<{ id: string }>('/experiences', data);
  }

  update(id: string, data: UpdateExperiencePayload) {
    return this.api.put<{ success: boolean }>(`/experiences/${id}`, data);
  }

  delete(id: string) {
    return this.api.delete<{ success: boolean }>(`/experiences/${id}`);
  }

  restore(id: string) {
    return this.api.patch<{ success: boolean }>(`/experiences/${id}/restore`, {});
  }

  listAllSkills() {
    return this.api.get<SkillOption[]>('/skills/all');
  }

  uploadMedia(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post(this.buildUrl('/media/upload'), formData, { withCredentials: true, responseType: 'text' })
      .pipe(
        timeout(this.apiConfig.timeout),
        map((id) => id.trim())
      );
  }

  private buildUrl(endpoint: string): string {
    const normalized = endpoint.replace(/^\//, '');
    const prefixes = Array.isArray(this.apiConfig.urlPrefix) ? this.apiConfig.urlPrefix : [this.apiConfig.urlPrefix];
    const prefix = prefixes.filter(Boolean).join('/');
    return prefix ? `${this.apiConfig.baseUrl}/${prefix}/${normalized}` : `${this.apiConfig.baseUrl}/${normalized}`;
  }
}
