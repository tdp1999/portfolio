import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';
import {
  AdminAboutPrinciple,
  AboutPrincipleListResponse,
  CreateAboutPrinciplePayload,
  ReorderAboutPrinciplesPayload,
  UpdateAboutPrinciplePayload,
} from './about-principle.types';

@Injectable({ providedIn: 'root' })
export class AboutPrincipleService {
  private readonly api = inject(ApiService);

  list() {
    return this.api.get<AboutPrincipleListResponse>('/admin/about/principles');
  }

  getById(id: string) {
    return this.api.get<AdminAboutPrinciple>(`/admin/about/principles/${id}`);
  }

  create(data: CreateAboutPrinciplePayload) {
    return this.api.post<{ id: string }>('/admin/about/principles', data);
  }

  update(id: string, data: UpdateAboutPrinciplePayload) {
    return this.api.patch<{ success: boolean }>(`/admin/about/principles/${id}`, data);
  }

  delete(id: string) {
    return this.api.delete<{ success: boolean }>(`/admin/about/principles/${id}`);
  }

  reorder(payload: ReorderAboutPrinciplesPayload) {
    return this.api.post<{ success: boolean }>('/admin/about/principles/reorder', payload);
  }
}
