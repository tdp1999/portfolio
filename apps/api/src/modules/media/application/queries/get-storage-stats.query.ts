import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IMediaRepository } from '../ports/media.repository.port';
import { MEDIA_REPOSITORY } from '../media.token';
import { StorageStatsDto } from '../media.dto';

export class GetStorageStatsQuery {
  constructor(readonly includeDeleted: boolean = false) {}
}

@QueryHandler(GetStorageStatsQuery)
export class GetStorageStatsHandler implements IQueryHandler<GetStorageStatsQuery> {
  constructor(@Inject(MEDIA_REPOSITORY) private readonly repo: IMediaRepository) {}

  async execute(query: GetStorageStatsQuery): Promise<StorageStatsDto> {
    return await this.repo.getStorageStats({ includeDeleted: query.includeDeleted });
  }
}
