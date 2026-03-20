export interface UploadOptions {
  folder: string;
  resourceType?: 'image' | 'video' | 'raw';
}

export interface StorageResult {
  externalId: string;
  url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
}

export interface FileInput {
  buffer: Buffer;
  originalFilename: string;
  mimeType: string;
}

export interface BulkUploadResult {
  succeeded: (StorageResult & { originalFilename: string })[];
  failed: { filename: string; error: string }[];
}

export interface IStorageService {
  upload(file: Buffer, options: UploadOptions): Promise<StorageResult>;
  uploadBulk(files: FileInput[], options: UploadOptions): Promise<BulkUploadResult>;
  delete(externalId: string): Promise<void>;
  generateUrl(externalId: string, transforms?: Record<string, string>): string;
}
