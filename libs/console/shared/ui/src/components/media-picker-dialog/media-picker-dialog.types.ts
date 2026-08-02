import type {
  MediaItem,
  MediaListParams,
  MediaListResponse,
  MediaMimeGroup,
  MediaUploadEvent,
  UpdateMediaPayload,
} from '@portfolio/console/shared/util';
import type { Observable } from 'rxjs';
import type { UploadFolder } from '../asset-filter-bar/asset-filter-bar.types';

export interface MediaPickerDataSource {
  list(params: MediaListParams): Observable<MediaListResponse>;
  /**
   * Emits progress ticks while sending, then a final tick carrying `id`. Anything
   * narrower (a bare `Observable<{ id }>`) forces the dialog to invent a 0% and a
   * 100% around a single emission, which is exactly the fake progress bar this
   * signature replaces.
   */
  upload(file: File, folder?: string): Observable<MediaUploadEvent>;
  getById(id: string): Observable<MediaItem>;
  getByIdSilent(id: string): Observable<MediaItem>;
  /** Save alt text / caption written in the post-upload review step. */
  update(id: string, payload: UpdateMediaPayload): Observable<unknown>;
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

export type MediaPickerDialogResult = MediaItem | MediaItem[] | undefined;
