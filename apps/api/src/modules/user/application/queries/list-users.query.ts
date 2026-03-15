import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, UserErrorCode } from '@portfolio/shared/errors';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';
import { PaginationSearchSchema } from '../user.dto';

export class ListUsersQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(query: ListUsersQuery) {
    const { success, data, error } = PaginationSearchSchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: UserErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List users pagination validation failed',
      });

    const { data: users, total } = await this.repo.findAll({
      page: data.page,
      limit: data.limit,
      search: data.search,
    });

    return {
      data: users.map((u) => u.toPublicProps()),
      total,
      page: data.page,
      limit: data.limit,
    };
  }
}
