import { Injectable, inject } from '@angular/core';
import { ApiService } from '@portfolio/console/shared/data-access';
import {
  CreateRadarSourceInput,
  RadarFeedPage,
  RadarFeedParams,
  RadarItemDetail,
  RadarQueueStats,
  RadarSource,
  RadarUploadResult,
  RadarWorkflowProfile,
} from './radar.types';

@Injectable({ providedIn: 'root' })
export class RadarService {
  private readonly api = inject(ApiService);

  listItems(params: RadarFeedParams) {
    const queryParams: Record<string, string> = {
      page: String(params.page),
      limit: String(params.limit),
    };
    if (params.search) queryParams['search'] = params.search;
    if (params.providerTag) queryParams['providerTag'] = params.providerTag;
    if (params.contentType) queryParams['contentType'] = params.contentType;
    if (params.minScore !== undefined) queryParams['minScore'] = String(params.minScore);
    if (params.includePromo) queryParams['includePromo'] = 'true';
    if (params.status) queryParams['status'] = params.status;
    if (params.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params.sortDir) queryParams['sortDir'] = params.sortDir;
    return this.api.get<RadarFeedPage>('/radar/items', { params: queryParams });
  }

  getItem(id: string) {
    return this.api.get<RadarItemDetail>(`/radar/items/${id}`);
  }

  getQueueStats() {
    return this.api.get<RadarQueueStats>('/radar/items/stats');
  }

  requeueStuck() {
    return this.api.post<{ requeued: number }>('/radar/items/requeue-stuck', {});
  }

  getProfile() {
    return this.api.get<RadarWorkflowProfile>('/radar/profile');
  }

  saveProfile(body: string) {
    return this.api.put<RadarWorkflowProfile>('/radar/profile', { body });
  }

  listSources() {
    return this.api.get<RadarSource[]>('/radar/sources');
  }

  createSource(input: CreateRadarSourceInput) {
    return this.api.post<RadarSource>('/radar/sources', input);
  }

  setSourceActive(id: string, isActive: boolean) {
    return this.api.patch<void>(`/radar/sources/${id}/${isActive ? 'activate' : 'deactivate'}`, {});
  }

  uploadCapture(sourceId: string, file: File) {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.api.post<RadarUploadResult>(`/radar/sources/${sourceId}/captures/upload`, body);
  }
}
