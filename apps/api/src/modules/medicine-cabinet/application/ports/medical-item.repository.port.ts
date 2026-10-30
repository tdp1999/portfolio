import { PaginatedResult } from '@portfolio/shared/types';
import { MedicalItem } from '../../domain/entities/medical-item.entity';

export interface MedicalItemFindAllOptions {
  page: number;
  limit: number;
  profileId?: string;
}

export interface MedicalItemLookupRow {
  item: MedicalItem;
  profileName: string;
}

export interface IMedicalItemRepository {
  add(item: MedicalItem): Promise<string>;
  update(id: string, item: MedicalItem): Promise<void>;
  remove(id: string, item: MedicalItem): Promise<void>;
  /** Excludes deleted items. */
  findById(id: string): Promise<MedicalItem | null>;
  /** Newest `updatedAt` first (R10.1). */
  findAll(options: MedicalItemFindAllOptions): Promise<PaginatedResult<MedicalItem>>;
  /** Every item that is not deleted, with the person's name, no paging ('S6 Trang tra cứu'). */
  findLookup(): Promise<MedicalItemLookupRow[]>;
}
