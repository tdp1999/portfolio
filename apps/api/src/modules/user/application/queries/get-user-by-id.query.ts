import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseQuery } from '../../../../shared/cqrs/base.query';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';
import { UserErrorCode } from '../user-error-code';

export class GetUserByIdQuery extends BaseQuery {
  constructor(readonly targetUserId: string) {
    super();
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(query: GetUserByIdQuery) {
    IdentifierValue.from(query.targetUserId);
    const user = await this.repo.findById(query.targetUserId);
    if (!user)
      throw NotFoundError('User not found', {
        layer: ErrorLayer.APPLICATION,
        errorCode: UserErrorCode.NOT_FOUND,
      });
    return user.toPublicProps();
  }
}
