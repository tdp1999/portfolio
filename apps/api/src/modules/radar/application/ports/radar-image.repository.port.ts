import { ImageResult } from '../../domain/radar-media.util';
import { RadarMedia, RadarSharedPost } from '../../domain/radar.types';

export interface RadarItemImages {
  id: string;
  media: RadarMedia[];
  sharedPost: RadarSharedPost | null;
}

export interface IRadarImageRepository {
  /** Items with at least one `pending` image, on the post itself or on its shared post. */
  findWithPendingImages(limit: number): Promise<RadarItemImages[]>;
  /**
   * Merges upload results into the item's current media under a row lock. Returns the storage
   * ids that ended up referenced by nothing (item deleted, or image gone after a re-capture).
   */
  applyResults(itemId: string, results: ImageResult[]): Promise<{ orphaned: string[] }>;
  /** Storage ids of every stored image (post and shared post) across a source's items. */
  findStoredExternalIds(sourceId: string): Promise<string[]>;
}
