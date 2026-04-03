import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_CONFIG, ApiService } from '@portfolio/console/shared/data-access';
import { map, timeout } from 'rxjs';
import { ProfileAdminResponse, UpsertProfilePayload } from './profile.types';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  getProfile() {
    return this.api.get<ProfileAdminResponse>('/admin/profile');
  }

  upsert(data: UpsertProfilePayload) {
    return this.api.put<{ id: string }>('/admin/profile', data);
  }

  getJsonLd(locale: 'en' | 'vi' = 'en') {
    return this.api.get<unknown>(`/profile/json-ld`, { params: { locale } });
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
