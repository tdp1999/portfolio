import { Inject, Logger } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { STORAGE_SERVICE } from '../../../media/application/media.token';
import { IStorageService } from '../../../media/application/ports/storage.service.port';
import { ImageResult, mediaKey } from '../../domain/radar-media.util';
import { RadarMedia } from '../../domain/radar.types';
import { IImageDownloader } from '../ports/image-downloader.port';
import { IRadarImageRepository, RadarItemImages } from '../ports/radar-image.repository.port';
import { IMAGE_DOWNLOADER, RADAR_IMAGE_REPOSITORY } from '../radar.token';
import { deleteStoredImages } from '../radar-image.cleanup';

export const RADAR_IMAGE_FOLDER = 'radar';
const ITEMS_PER_BATCH = 10;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export interface PersistItemImagesResult {
  stored: number;
  failed: number;
  /** True when a run was already in progress; that run picks this call's work up instead. */
  alreadyRunning: boolean;
}

/**
 * Copies every `pending` image of every Radar item to our storage, one image at a time so a
 * large backfill never holds more than one buffer. Triggered without awaiting after an upload;
 * safe to call again at any time (a redeploy mid-run leaves the rest `pending` for next time).
 */
export class PersistItemImagesCommand {}

@CommandHandler(PersistItemImagesCommand)
export class PersistItemImagesHandler implements ICommandHandler<PersistItemImagesCommand> {
  private readonly logger = new Logger(PersistItemImagesHandler.name);
  /** Single API instance on Railway, so in-process flags are enough to avoid double uploads. */
  private running = false;
  /** Set when a call arrives mid-run, so the run drains once more before it stops. */
  private rerunRequested = false;

  constructor(
    @Inject(RADAR_IMAGE_REPOSITORY) private readonly repo: IRadarImageRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    @Inject(IMAGE_DOWNLOADER) private readonly downloader: IImageDownloader
  ) {}

  async execute(): Promise<PersistItemImagesResult> {
    if (this.running) {
      this.rerunRequested = true;
      return { stored: 0, failed: 0, alreadyRunning: true };
    }
    this.running = true;
    const totals = { stored: 0, failed: 0 };

    try {
      do {
        this.rerunRequested = false;
        await this.drain(totals);
      } while (this.rerunRequested);
    } finally {
      this.running = false;
    }

    this.logger.log(`Radar images: ${totals.stored} stored, ${totals.failed} failed`);
    return { ...totals, alreadyRunning: false };
  }

  /** Each pass turns every pending image it saw into stored or failed, so the loop ends. */
  private async drain(totals: { stored: number; failed: number }): Promise<void> {
    for (let batch = await this.repo.findWithPendingImages(ITEMS_PER_BATCH); batch.length > 0; ) {
      for (const item of batch) {
        const results = await this.persistItem(item, totals);
        const { orphaned } = await this.repo.applyResults(item.id, results);
        await deleteStoredImages(this.storage, orphaned, this.logger);
      }
      batch = await this.repo.findWithPendingImages(ITEMS_PER_BATCH);
    }
  }

  private async persistItem(item: RadarItemImages, totals: { stored: number; failed: number }) {
    const pending = [...item.media, ...(item.sharedPost?.media ?? [])].filter((m) => m.storageStatus === 'pending');
    const results: ImageResult[] = [];
    for (const m of pending) {
      results.push(await this.persistOne(m, totals));
    }
    return results;
  }

  private async persistOne(m: RadarMedia, totals: { stored: number; failed: number }): Promise<ImageResult> {
    const key = mediaKey(m);
    try {
      const { buffer, mimeType } = await this.downloader.download(m.url);
      const extension = EXTENSION_BY_MIME[mimeType];
      if (!extension) throw new Error(`Unsupported image type ${mimeType}`);

      const result = await this.storage.upload(buffer, {
        folder: RADAR_IMAGE_FOLDER,
        resourceType: 'image',
        originalFilename: `${m.externalId ?? 'radar-image'}.${extension}`,
        mimeType,
      });
      totals.stored++;
      return { key, outcome: 'stored', storedUrl: result.url, storedExternalId: result.externalId };
    } catch (error) {
      totals.failed++;
      const reason = error instanceof Error ? error.message : String(error);
      return { key, outcome: 'failed', error: reason.slice(0, 200) };
    }
  }
}
