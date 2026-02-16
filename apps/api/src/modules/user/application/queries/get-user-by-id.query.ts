import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BaseQuery } from '../../../../shared/cqrs/base.query';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';

export class GetUserByIdQuery extends BaseQuery {
  constructor(readonly targetUserId: string) {
    super();
  }
}

@QueryHandler(GetUserByIdQuery)
export class GetUserByIdHandler implements IQueryHandler<GetUserByIdQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(query: GetUserByIdQuery): Promise<User | null> {
    return this.repo.findById(query.targetUserId);
  }
}
