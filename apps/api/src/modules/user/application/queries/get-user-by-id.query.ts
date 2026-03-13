import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ForbiddenError, ErrorLayer, UserErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseQuery } from '../../../../shared/cqrs/base.query';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';

export class GetUserByIdQuery extends BaseQuery {
  constructor(
    readonly targetUserId: string,
    readonly requesterId: string,
    readonly requesterRole: string
  ) {
    super(requesterId);
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(query: GetUserByIdQuery) {
    IdentifierValue.from(query.targetUserId);

    if (query.requesterId !== query.targetUserId && query.requesterRole !== 'ADMIN') {
      throw ForbiddenError('You can only access your own profile', {
        layer: ErrorLayer.APPLICATION,
        errorCode: UserErrorCode.ACCESS_DENIED,
      });
    }

    const user = await this.repo.findById(query.targetUserId);
    if (!user)
      throw NotFoundError('User not found', {
        layer: ErrorLayer.APPLICATION,
        errorCode: UserErrorCode.NOT_FOUND,
      });
    return user.toPublicProps();
  }
}
