import { RadarItem } from '../../domain/entities/radar-item.entity';

export interface IRadarCommentsRepository {
  /** Items whose last capture was this run and whose comments were never fetched, newest first. */
  findCandidates(runId: string): Promise<RadarItem[]>;
  findById(itemId: string): Promise<RadarItem | null>;
  /** Ids that no longer exist are left out. */
  findByIds(itemIds: readonly string[]): Promise<RadarItem[]>;
  /** Every item of a source, for matching an uploaded comments export by post URL. */
  findBySource(sourceId: string): Promise<RadarItem[]>;
  /** Writes the item's comment state; nothing else of the item. */
  saveComments(item: RadarItem): Promise<void>;
  /** Writes only the FAILED status and its error, so comments stored meanwhile are never overwritten. */
  saveCommentsFailure(items: readonly RadarItem[]): Promise<void>;
}
