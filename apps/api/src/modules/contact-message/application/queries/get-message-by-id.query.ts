import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';

import { ContactMessageErrorCode, ErrorLayer, NotFoundError } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { ContactMessageResponseDto } from '../contact-message.dto';
import { ContactMessagePresenter } from '../contact-message.presenter';
import { CONTACT_MESSAGE_REPOSITORY } from '../contact-message.token';
import { IContactMessageRepository } from '../ports/contact-message.repository.port';

export class GetMessageByIdQuery {
  constructor(readonly messageId: string) {}
}

@QueryHandler(GetMessageByIdQuery)
export class GetMessageByIdHandler implements IQueryHandler<GetMessageByIdQuery> {
  constructor(@Inject(CONTACT_MESSAGE_REPOSITORY) private readonly repo: IContactMessageRepository) {}

  async execute(query: GetMessageByIdQuery): Promise<ContactMessageResponseDto> {
    IdentifierValue.from(query.messageId);

    const message = await this.repo.findById(query.messageId);
    if (!message)
      throw NotFoundError('Contact message not found', {
        errorCode: ContactMessageErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return ContactMessagePresenter.toResponse(message);
  }
}
