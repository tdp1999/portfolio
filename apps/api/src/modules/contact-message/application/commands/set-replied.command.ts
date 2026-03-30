import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';

import { NotFoundError, ContactMessageErrorCode, ErrorLayer } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { IContactMessageRepository } from '../ports/contact-message.repository.port';
import { CONTACT_MESSAGE_REPOSITORY } from '../contact-message.token';

export class SetRepliedCommand {
  constructor(readonly messageId: string) {}
}

@CommandHandler(SetRepliedCommand)
export class SetRepliedHandler implements ICommandHandler<SetRepliedCommand> {
  constructor(@Inject(CONTACT_MESSAGE_REPOSITORY) private readonly repo: IContactMessageRepository) {}

  async execute(command: SetRepliedCommand): Promise<void> {
    IdentifierValue.from(command.messageId);

    const message = await this.repo.findById(command.messageId);
    if (!message) {
      throw NotFoundError('Contact message not found', {
        errorCode: ContactMessageErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const updated = message.setReplied();
    await this.repo.update(command.messageId, updated);
  }
}
