import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, UserErrorCode } from '@portfolio/shared/errors';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';
import { PaginationSearchSchema, UserAdminDto } from '../user.dto';

export class ListUsersQuery {
  constructor(readonly params: unknown) {}
}

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(query: ListUsersQuery): Promise<{ data: UserAdminDto[]; total: number; page: number; limit: number }> {
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
      status: data.status,
      includeDeleted: true,
    });

    return {
      data: users.map((u) => u.toAdminProps()),
      total,
      page: data.page,
      limit: data.limit,
    };
  }
}
