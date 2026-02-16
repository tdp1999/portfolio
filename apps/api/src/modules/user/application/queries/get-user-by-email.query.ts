import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BaseQuery } from '../../../../shared/cqrs/base.query';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';

export class GetUserByEmailQuery extends BaseQuery {
  constructor(readonly email: string) {
    super();
  }
}

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(query: GetUserByEmailQuery): Promise<User | null> {
    return this.repo.findByEmail(query.email);
  }
}
