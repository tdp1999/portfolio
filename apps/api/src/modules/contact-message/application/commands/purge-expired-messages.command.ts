import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';

import { IContactMessageRepository } from '../ports/contact-message.repository.port';
import { CONTACT_MESSAGE_REPOSITORY } from '../contact-message.token';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export class PurgeExpiredMessagesCommand {}

@CommandHandler(PurgeExpiredMessagesCommand)
export class PurgeExpiredMessagesHandler implements ICommandHandler<PurgeExpiredMessagesCommand> {
  private readonly logger = new Logger(PurgeExpiredMessagesHandler.name);

  constructor(@Inject(CONTACT_MESSAGE_REPOSITORY) private readonly repo: IContactMessageRepository) {}

  async execute(_command: PurgeExpiredMessagesCommand): Promise<{ expiredCount: number; softDeletedCount: number }> {
    const expiredCount = await this.repo.hardDeleteExpired();
    const softDeletedCount = await this.repo.hardDeleteOldSoftDeleted(new Date(Date.now() - THIRTY_DAYS_MS));

    if (expiredCount > 0 || softDeletedCount > 0) {
      this.logger.log(`Purged ${expiredCount} expired + ${softDeletedCount} soft-deleted messages`);
    }

    return { expiredCount, softDeletedCount };
  }
}
