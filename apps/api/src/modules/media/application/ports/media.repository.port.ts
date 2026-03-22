import { ICrudRepository, PaginatedQuery, PaginatedResult } from '@portfolio/shared/types';
import { Media } from '../../domain/entities/media.entity';

export interface MediaFindAllOptions extends PaginatedQuery {
  mimeTypePrefix?: string;
  includeDeleted?: boolean;
}

export interface StorageStatsResult {
  totalFiles: number;
  totalBytes: number;
  breakdown: { mimeTypePrefix: string; count: number; bytes: number }[];
}

export type IMediaRepository = ICrudRepository<Media> & {
  update(id: string, media: Media): Promise<void>;
  remove(id: string, media: Media): Promise<void>;
  hardDelete(id: string): Promise<void>;
  findByIdIncludeDeleted(id: string): Promise<Media | null>;
  findByPublicId(publicId: string): Promise<Media | null>;
  findByMimeTypePrefix(prefix: string): Promise<Media[]>;
  findOrphans(): Promise<Media[]>;
  findExpiredSoftDeleted(olderThan: Date): Promise<Media[]>;
  findDeleted(options: PaginatedQuery): Promise<PaginatedResult<Media>>;
  findAll(options: MediaFindAllOptions): Promise<PaginatedResult<Media>>;
  getStorageStats(options?: { includeDeleted?: boolean }): Promise<StorageStatsResult>;
};
