import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';

import { ContactMessageErrorCode, ErrorLayer, ValidationError } from '@portfolio/shared/errors';

import { ContactMessageQuerySchema, ContactMessageListItemDto } from '../contact-message.dto';
import { ContactMessagePresenter } from '../contact-message.presenter';
import { CONTACT_MESSAGE_REPOSITORY } from '../contact-message.token';
import { IContactMessageRepository } from '../ports/contact-message.repository.port';

export class ListMessagesQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListMessagesQuery)
export class ListMessagesHandler implements IQueryHandler<ListMessagesQuery> {
  constructor(@Inject(CONTACT_MESSAGE_REPOSITORY) private readonly repo: IContactMessageRepository) {}

  async execute(
    query: ListMessagesQuery
  ): Promise<{ data: ContactMessageListItemDto[]; total: number; page: number; limit: number }> {
    const { success, data, error } = ContactMessageQuerySchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: ContactMessageErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List messages pagination validation failed',
      });

    const { data: messages, total } = await this.repo.findAll({
      page: data.page,
      limit: data.limit,
      search: data.search,
      status: data.status,
      purpose: data.purpose,
      includeSpam: data.includeSpam,
      includeDeleted: data.includeDeleted,
    });

    return {
      data: messages.map(ContactMessagePresenter.toListItem),
      total,
      page: data.page,
      limit: data.limit,
    };
  }
}
