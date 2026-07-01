import type { Observable } from 'rxjs';
import type { MediaItem } from '@portfolio/console/shared/util';

export type UploadState = 'uploading' | 'done' | 'error';

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
