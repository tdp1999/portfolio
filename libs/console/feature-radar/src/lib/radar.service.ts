import { HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { ApiService, SKIP_ERROR_HANDLING } from '@portfolio/console/shared/data-access';
import {
  CreateRadarBriefInput,
  CreateRadarRunInput,
  CreateRadarSourceInput,
  RadarBrief,
  RadarBriefDetail,
  RadarRun,
  RadarFeedPage,
  RadarFeedParams,
  RadarItemDetail,
  RadarQueueStats,
  RadarSource,
  RadarUploadResult,
  RadarCommentsSettings,
  RadarCommentsUploadResult,
  RadarItemCommentsFetch,
  RadarTriageStatus,
  RadarWorkflowProfile,
  RadarAiSettings,
  RadarTrial,
  CreateRadarTrialsInput,
  CreateRadarTrialsResult,
  ReanalyzeItemsInput,
  ReanalyzeItemsResult,
  RadarRunDetail,
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
    if (params.sourceId) queryParams['sourceId'] = params.sourceId;
    if (params.runId) queryParams['runId'] = params.runId;
    if (params.sortBy) queryParams['sortBy'] = params.sortBy;
    if (params.sortDir) queryParams['sortDir'] = params.sortDir;
    if (params.triageStatus) queryParams['triageStatus'] = params.triageStatus;
    return this.api.get<RadarFeedPage>('/radar/items', { params: queryParams });
  }

  getItem(id: string) {
    return this.api.get<RadarItemDetail>(`/radar/items/${id}`);
  }

  /** One status for every id; ids that no longer exist are skipped, so `updated` can be lower. */
  triageItems(ids: string[], status: RadarTriageStatus) {
    return this.api.patch<{ updated: number }>('/radar/items/triage', { ids, status });
  }

  /** AUTO starts a re-analysis run right away; WORKER leaves the posts for the next `/radar work`. */
  reanalyzeItems(input: ReanalyzeItemsInput) {
    return this.api.post<ReanalyzeItemsResult>('/radar/items/reanalyze', input);
  }

  /** Quality trials run in the background; poll `listTrials` until none is RUNNING. */
  createTrials(input: CreateRadarTrialsInput) {
    return this.api.post<CreateRadarTrialsResult>('/radar/trials', input);
  }

  listTrials(itemId: string) {
    return this.api.get<RadarTrial[]>(`/radar/items/${itemId}/trials`);
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

  /** With a `runId` the file fills that Manual run instead of opening a new one. */
  uploadCapture(sourceId: string, file: File, runId?: string) {
    const body = new FormData();
    body.append('file', file, file.name);
    if (runId) body.append('runId', runId);
    return this.api.post<RadarUploadResult>(`/radar/sources/${sourceId}/captures/upload`, body);
  }

  /** A comments export from the Apify console; comments are matched to this source's posts by URL. */
  uploadComments(sourceId: string, file: File) {
    const body = new FormData();
    body.append('file', file, file.name);
    return this.api.post<RadarCommentsUploadResult>(`/radar/sources/${sourceId}/comments/upload`, body);
  }

  /** Billed: starts the comments actor for this one post (capped per call). Poll {@link collectComments} for the result. */
  fetchComments(itemId: string) {
    return this.api.post<RadarItemCommentsFetch>(`/radar/items/${itemId}/comments/fetch`, {});
  }

  /** Reads the job; once it finished, the item's comments are replaced. A failed job errors once, ending the poll. */
  collectComments(itemId: string, jobRef: string) {
    return this.api.post<RadarItemCommentsFetch>(`/radar/items/${itemId}/comments/fetch/${jobRef}`, {});
  }

  aiSettings() {
    return this.api.get<RadarAiSettings>('/radar/ai/settings');
  }

  commentsSettings() {
    return this.api.get<RadarCommentsSettings>('/radar/comments/settings');
  }

  /** `silent` skips the error toast: a background poll or a header badge must not raise one every few seconds. */
  listRuns(silent = false) {
    const context = silent ? new HttpContext().set(SKIP_ERROR_HANDLING, true) : undefined;
    return this.api.get<RadarRun[]>('/radar/runs', { context });
  }

  /** `silent` for the Detail page's poll while the run is still going. */
  getRun(id: string, silent = false) {
    const context = silent ? new HttpContext().set(SKIP_ERROR_HANDLING, true) : undefined;
    return this.api.get<RadarRunDetail>(`/radar/runs/${id}`, { context });
  }

  createRun(input: CreateRadarRunInput) {
    return this.api.post<RadarRun>('/radar/runs', input);
  }

  cancelRun(id: string) {
    return this.api.post<RadarRun>(`/radar/runs/${id}/cancel`, {});
  }

  /** `silent` as in `listRuns`: the list polls while a brief waits for the worker. */
  listBriefs(silent = false) {
    const context = silent ? new HttpContext().set(SKIP_ERROR_HANDLING, true) : undefined;
    return this.api.get<RadarBrief[]>('/radar/briefs', { context });
  }

  /** `silent` for the Detail page's poll while the brief waits for the worker. */
  getBrief(id: string, silent = false) {
    const context = silent ? new HttpContext().set(SKIP_ERROR_HANDLING, true) : undefined;
    return this.api.get<RadarBriefDetail>(`/radar/briefs/${id}`, { context });
  }

  createBrief(input: CreateRadarBriefInput) {
    return this.api.post<RadarBrief>('/radar/briefs', input);
  }
}
