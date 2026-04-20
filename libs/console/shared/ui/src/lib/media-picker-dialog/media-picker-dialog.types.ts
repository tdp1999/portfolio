import type { MediaItem, MediaListParams, MediaListResponse, MediaMimeGroup } from '@portfolio/console/shared/util';
import type { Observable } from 'rxjs';
import type { UploadFolder } from '../asset-filter-bar/asset-filter-bar.types';

export interface MediaPickerDataSource {
  list(params: MediaListParams): Observable<MediaListResponse>;
  upload(file: File, folder?: string): Observable<{ id: string }>;
  getById(id: string): Observable<MediaItem>;
  getByIdSilent(id: string): Observable<MediaItem>;
}

export interface MediaPickerDialogData {
  mode: 'single' | 'multi';
  selectedIds?: string[];
  /** Passed verbatim to the upload zone's `accept` attribute (HTML file input format). */
  mimeFilter?: string;
  /** Passed as `mimeGroup` to the API list query. Takes precedence over mimeFilter for library filtering. */
  mimeGroup?: MediaMimeGroup;
  defaultFolder?: UploadFolder;
  dataSource: MediaPickerDataSource;
}

export type MediaPickerDialogResult = string | string[] | undefined;
