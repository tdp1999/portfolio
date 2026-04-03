import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import type { Locale } from '@portfolio/shared/types';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { ProfileJsonLdDto } from '../profile.dto';
import { ProfilePresenter } from '../profile.presenter';

export class GetJsonLdQuery {
  constructor(readonly locale: Locale = 'en') {}
}

@QueryHandler(GetJsonLdQuery)
export class GetJsonLdHandler implements IQueryHandler<GetJsonLdQuery> {
  constructor(@Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository) {}

  async execute(query: GetJsonLdQuery): Promise<ProfileJsonLdDto> {
    const result = await this.repo.findOwnerProfile();
    if (!result)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return ProfilePresenter.toJsonLd(result.profile, query.locale, result.avatarUrl);
  }
}
