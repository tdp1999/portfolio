import {
  HttpClient,
  HttpContext,
  HttpEventType,
  type HttpProgressEvent,
  type HttpResponse,
} from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { filter, map, timeout } from 'rxjs';
import { API_CONFIG, ApiService } from '../api';
import { SKIP_ERROR_HANDLING } from '../interceptors/error.interceptor';
import {
  MediaItem,
  MediaListParams,
  MediaUploadEvent,
  MediaListResponse,
  StorageStats,
  UpdateMediaPayload,
} from '@portfolio/console/shared/util';

@Injectable({ providedIn: 'root' })
export class MediaService {
  /**
   * Idle allowance for an upload, replacing the shared `apiConfig.timeout` on this
   * one call.
   *
   * With `observe: 'events'` the rxjs `timeout` measures SILENCE BETWEEN EVENTS, not
   * total duration — a different instrument from the one the shared 30s budget was
   * chosen for. This request has one deliberately silent stretch: once the last byte
   * is sent, the API is handing the file to the storage backend and emits nothing
   * until the response. For a large image that stretch alone can outlast 30s, and
   * aborting it is the worst outcome available: the asset is created server-side
   * while the author is told the upload failed.
   */
  private static readonly UPLOAD_IDLE_TIMEOUT_MS = 120_000;

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
    if (params.mimeGroup) queryParams['mimeGroup'] = params.mimeGroup;
    if (params.folder) queryParams['folder'] = params.folder;
    if (params.sort) queryParams['sort'] = params.sort;
    return this.api.get<MediaListResponse>('/media', { params: queryParams });
  }

  getById(id: string) {
    return this.api.get<MediaItem>(`/media/${id}`);
  }

  getByIdSilent(id: string) {
    return this.api.get<MediaItem>(`/media/${id}`, {
      context: new HttpContext().set(SKIP_ERROR_HANDLING, true),
    });
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

  /**
   * Emits real upload progress, then the new media id.
   *
   * `reportProgress` + `observe: 'events'` is what makes the percentage real. Without
   * them `HttpClient` emits exactly once, at the end — which is why the upload rows
   * used to show 0% and then 100% with nothing in between; the two values were
   * synthesised by the caller, not measured.
   *
   * What the number means: bytes handed from the browser to the API. The API then
   * uploads to Cloudinary, and that leg is invisible from here — so the stream stays
   * at `progress: 100` with no `id` until the response lands. Callers render that gap
   * as "Processing", never as a stalled bar (see `UploadRowState.state`).
   */
  upload(file: File, options?: { folder?: string; altText?: string; caption?: string }) {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.folder) formData.append('folder', options.folder);
    if (options?.altText) formData.append('altText', options.altText);
    if (options?.caption) formData.append('caption', options.caption);
    return this.http
      .post(this.buildUrl('/media/upload'), formData, {
        withCredentials: true,
        responseType: 'text',
        observe: 'events',
        reportProgress: true,
      })
      .pipe(
        timeout({ each: MediaService.UPLOAD_IDLE_TIMEOUT_MS }),
        // Sent / ResponseHeader / DownloadProgress carry nothing a progress bar wants.
        filter(
          (event): event is HttpProgressEvent | HttpResponse<string> =>
            event.type === HttpEventType.UploadProgress || event.type === HttpEventType.Response
        ),
        map((event): MediaUploadEvent => {
          if (event.type === HttpEventType.Response) {
            const id = (event.body ?? '').trim();
            // A 2xx with no id is a failed upload wearing a success costume. Failing
            // loudly here sends the row to `error`; returning it as a plain progress
            // tick would leave the row on "Processing" forever, because a row in that
            // state is never counted as settled and the batch never completes.
            if (!id) throw new Error('The upload finished but the server returned no media id.');
            return { progress: 100, id };
          }
          // `total` is absent when the body length is unknown; hold at 0 rather than
          // dividing by undefined and rendering NaN%.
          const percent = event.total ? Math.round((event.loaded / event.total) * 100) : 0;
          // 100 is reserved for "the server answered". A finished send with no
          // response yet caps at 99, so the bar never sits full while work remains.
          return { progress: Math.min(percent, 99) };
        })
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
