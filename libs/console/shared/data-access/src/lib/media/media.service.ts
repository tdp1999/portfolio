import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, timeout } from 'rxjs';
import { API_CONFIG, ApiService } from '../api';
import { MediaItem, MediaListParams, MediaListResponse, StorageStats, UpdateMediaPayload } from './media.types';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(API_CONFIG);

  list(params: MediaListParams) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.search) queryParams['search'] = params.search;
    if (params.mimeTypePrefix) queryParams['mimeTypePrefix'] = params.mimeTypePrefix;
    return this.api.get<MediaListResponse>('/media', { params: queryParams });
  }

  getById(id: string) {
    return this.api.get<MediaItem>(`/media/${id}`);
  }

  getStats() {
    return this.api.get<StorageStats>('/media/stats');
  }

  listDeleted(params: { page: number; limit: number }) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    return this.api.get<MediaListResponse>('/media/trash', { params: queryParams });
  }

  upload(file: File, metadata?: { altText?: string; caption?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata?.altText) formData.append('altText', metadata.altText);
    if (metadata?.caption) formData.append('caption', metadata.caption);
    return this.http
      .post(this.buildUrl('/media/upload'), formData, {
        withCredentials: true,
        responseType: 'text',
      })
      .pipe(
        timeout(this.apiConfig.timeout),
        map((id) => ({ id }))
      );
  }

  bulkUpload(files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return this.http
      .post(this.buildUrl('/media/upload/bulk'), formData, {
        withCredentials: true,
        responseType: 'text',
      })
      .pipe(timeout(this.apiConfig.timeout));
  }

  private buildUrl(endpoint: string): string {
    const normalized = endpoint.replace(/^\//, '');
    const prefixes = Array.isArray(this.apiConfig.urlPrefix) ? this.apiConfig.urlPrefix : [this.apiConfig.urlPrefix];
    const prefix = prefixes.filter(Boolean).join('/');
    return prefix ? `${this.apiConfig.baseUrl}/${prefix}/${normalized}` : `${this.apiConfig.baseUrl}/${normalized}`;
  }

  update(id: string, data: UpdateMediaPayload) {
    return this.api.patch<{ success: boolean }>(`/media/${id}`, data);
  }

  delete(id: string) {
    return this.api.delete<{ success: boolean }>(`/media/${id}`);
  }

  restore(id: string) {
    return this.api.post<{ success: boolean }>(`/media/${id}/restore`, {});
  }
}
