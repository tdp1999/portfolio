import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';
import {
  AdminAboutFailure,
  AboutFailureListResponse,
  CreateAboutFailurePayload,
  ReorderAboutFailuresPayload,
  UpdateAboutFailurePayload,
} from './about-failure.types';

@Injectable({ providedIn: 'root' })
export class AboutFailureService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<AboutFailureListResponse>('/admin/about/failures');
  }

  getById(id: string) {
    return this.api.get<AdminAboutFailure>(`/admin/about/failures/${id}`);
  }

  create(data: CreateAboutFailurePayload) {
    return this.api.post<{ id: string }>('/admin/about/failures', data);
  }

  update(id: string, data: UpdateAboutFailurePayload) {
    return this.api.patch<{ success: boolean }>(`/admin/about/failures/${id}`, data);
  }

  delete(id: string) {
    return this.api.delete<{ success: boolean }>(`/admin/about/failures/${id}`);
  }

  reorder(payload: ReorderAboutFailuresPayload) {
    return this.api.post<{ success: boolean }>('/admin/about/failures/reorder', payload);
  }
}
