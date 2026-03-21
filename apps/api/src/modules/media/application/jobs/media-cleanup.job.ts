import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';
import { IMediaRepository } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../media.token';
import { HardDeleteMediaCommand } from '../commands';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
const RETENTION_DAYS = 30;
const BATCH_SIZE = 50;

@Injectable()
export class MediaCleanupJob {
  private readonly logger = new Logger(MediaCleanupJob.name);

  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository,
    private readonly commandBus: CommandBus
  ) {}

  @Cron('0 3 * * *')
  async handleExpiredSoftDeletes(): Promise<void> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

    this.logger.log(`Starting cleanup of soft-deleted media older than ${cutoff.toISOString()}`);

    const expired = await this.repo.findExpiredSoftDeleted(cutoff);

    if (expired.length === 0) {
      this.logger.log('No expired soft-deleted media found');
      return;
    }

    let deleted = 0;
    let failed = 0;

    for (let i = 0; i < expired.length; i += BATCH_SIZE) {
      const batch = expired.slice(i, i + BATCH_SIZE);

      await Promise.allSettled(
        batch.map(async (media) => {
          try {
            await this.commandBus.execute(new HardDeleteMediaCommand(media.id, SYSTEM_USER_ID));
            deleted++;
          } catch (err) {
            failed++;
            this.logger.warn(`Failed to hard-delete media ${media.id}: ${err instanceof Error ? err.message : err}`);
          }
        })
      );
    }

    this.logger.log(`Cleanup complete: ${deleted} deleted, ${failed} failed out of ${expired.length} total`);
  }

  @Cron('0 4 * * 0')
  async handleOrphanDetection(): Promise<void> {
    this.logger.log('Starting weekly orphan detection scan');

    const orphans = await this.repo.findOrphans();

    if (orphans.length === 0) {
      this.logger.log('No orphaned media found');
      return;
    }

    this.logger.warn(`Found ${orphans.length} orphaned media files: ${orphans.map((m) => m.id).join(', ')}`);
  }
}
