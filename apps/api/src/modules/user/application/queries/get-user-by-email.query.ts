import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { z } from 'zod';
import { BadRequestError, NotFoundError, ErrorLayer } from '@portfolio/shared/errors';
import { BaseQuery } from '../../../../shared/cqrs/base.query';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';
import { UserErrorCode } from '../user-error-code';

export class GetUserByEmailQuery extends BaseQuery {
  constructor(readonly email: string) {
    super();
  }
}

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(query: GetUserByEmailQuery) {
    const result = z.email().safeParse(query.email);
    if (!result.success) {
      throw BadRequestError('Invalid email format', {
        layer: ErrorLayer.APPLICATION,
        errorCode: UserErrorCode.INVALID_INPUT,
      });
    }

    const user = await this.repo.findByEmail(query.email);
    if (!user)
      throw NotFoundError('User not found', {
        layer: ErrorLayer.APPLICATION,
        errorCode: UserErrorCode.NOT_FOUND,
      });
    return user.toPublicProps();
  }
}
