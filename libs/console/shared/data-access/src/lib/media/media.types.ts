// --- Response types (aligned with API MediaResponseDto) ---

export interface MediaItem {
  id: string;
  originalFilename: string;
  mimeType: string;
  url: string;
  format: string;
  bytes: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  caption: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface MediaListResponse {
  data: MediaItem[];
  total: number;
  page: number;
  limit: number;
}

export interface StorageStats {
  totalFiles: number;
  totalBytes: number;
  breakdown: { mimeTypePrefix: string; count: number; bytes: number }[];
}

export interface UploadResult {
  id: string;
  originalFilename: string;
  url: string;
}

export interface BulkUploadResult {
  uploaded: UploadResult[];
  failed: { filename: string; error: string }[];
}

// --- Payload types ---

export interface MediaListParams {
  page: number;
  limit: number;
  search?: string;
  mimeTypePrefix?: string;
}

export interface UpdateMediaPayload {
  altText?: string | null;
  caption?: string | null;
}
