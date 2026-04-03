import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { ProfilePublicResponseDto } from '../profile.dto';
import { ProfilePresenter } from '../profile.presenter';

export class GetPublicProfileQuery {}

@QueryHandler(GetPublicProfileQuery)
export class GetPublicProfileHandler implements IQueryHandler<GetPublicProfileQuery> {
  constructor(@Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository) {}

  async execute(): Promise<ProfilePublicResponseDto> {
    const result = await this.repo.findOwnerProfile();
    if (!result)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return ProfilePresenter.toPublicResponse(result.profile, result.avatarUrl, result.ogImageUrl);
  }
}
