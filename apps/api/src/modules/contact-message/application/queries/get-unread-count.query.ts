import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';

import { UnreadCountDto } from '../contact-message.dto';
import { ContactMessagePresenter } from '../contact-message.presenter';
import { CONTACT_MESSAGE_REPOSITORY } from '../contact-message.token';
import { IContactMessageRepository } from '../ports/contact-message.repository.port';

export class GetUnreadCountQuery {}

@QueryHandler(GetUnreadCountQuery)
export class GetUnreadCountHandler implements IQueryHandler<GetUnreadCountQuery> {
  constructor(@Inject(CONTACT_MESSAGE_REPOSITORY) private readonly repo: IContactMessageRepository) {}

  async execute(_query: GetUnreadCountQuery): Promise<UnreadCountDto> {
    const count = await this.repo.getUnreadCount();
    return ContactMessagePresenter.toUnreadCount(count);
  }
}
