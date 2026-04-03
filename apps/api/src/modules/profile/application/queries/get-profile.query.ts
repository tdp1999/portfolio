import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { ProfileAdminResponseDto } from '../profile.dto';
import { ProfilePresenter } from '../profile.presenter';

export class GetProfileQuery {
  constructor(readonly userId: string) {}
}

@QueryHandler(GetProfileQuery)
export class GetProfileHandler implements IQueryHandler<GetProfileQuery> {
  constructor(@Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository) {}

  async execute(query: GetProfileQuery): Promise<ProfileAdminResponseDto> {
    const result = await this.repo.findWithMedia(query.userId);
    if (!result)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return ProfilePresenter.toAdminResponse(result.profile, result.avatarUrl, result.ogImageUrl);
  }
}
