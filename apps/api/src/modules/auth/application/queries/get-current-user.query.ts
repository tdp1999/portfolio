import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, AuthErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseQuery } from '../../../../shared/cqrs/base.query';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';

export class GetCurrentUserQuery extends BaseQuery {
  constructor(readonly targetUserId: string) {
    super(targetUserId);
  }
}

@QueryHandler(GetCurrentUserQuery)
export class GetCurrentUserHandler implements IQueryHandler<GetCurrentUserQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(query: GetCurrentUserQuery) {
    IdentifierValue.from(query.targetUserId);
    const user = await this.repo.findById(query.targetUserId);
    if (!user)
      throw NotFoundError('User not found', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.UNAUTHORIZED,
      });
    return user.toPublicProps();
  }
}
