import type { Observable } from 'rxjs';
import type { MediaItem } from '@portfolio/console/shared/util';

/**
 * `processing` is the gap the progress bar cannot measure: the bytes have all left
 * the browser, but the API is still handing them to the storage backend. Rendering
 * it as a distinct state is the honest option — the alternative is a bar parked at
 * 100% for several seconds, which reads as a hang.
 */
export type UploadState = 'uploading' | 'processing' | 'done' | 'error';

export interface UploadProgress {
  progress: number;
  result?: MediaItem;
}

export type UploadFn = (file: File) => Observable<UploadProgress>;

export interface UploadRowState {
  id: string;
  file: File;
  state: UploadState;
  progress: number;
  result?: MediaItem;
  error?: Error;
}
