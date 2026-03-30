import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CommandBus } from '@nestjs/cqrs';

import { PurgeExpiredMessagesCommand } from '../commands';

@Injectable()
export class MessagePurgeJob {
  private readonly logger = new Logger(MessagePurgeJob.name);

  constructor(private readonly commandBus: CommandBus) {}

  @Cron('0 3 * * *')
  async handlePurge(): Promise<void> {
    this.logger.log('Starting contact message purge');

    const result: { expiredCount: number; softDeletedCount: number } = await this.commandBus.execute(
      new PurgeExpiredMessagesCommand()
    );

    this.logger.log(`Purged ${result.expiredCount} expired, ${result.softDeletedCount} soft-deleted messages`);
  }
}
