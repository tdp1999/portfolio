import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, AboutFailureErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { IAboutFailureRepository } from '../ports/about-failure.repository.port';
import { ABOUT_FAILURE_REPOSITORY } from '../about-failure.token';
import { AboutFailureDto } from '../about-failure.dto';
import { AboutFailurePresenter } from '../about-failure.presenter';

export class GetAboutFailureByIdQuery {
  constructor(readonly failureId: string) {}
}

@QueryHandler(GetAboutFailureByIdQuery)
export class GetAboutFailureByIdHandler implements IQueryHandler<GetAboutFailureByIdQuery> {
  constructor(@Inject(ABOUT_FAILURE_REPOSITORY) private readonly repo: IAboutFailureRepository) {}

  async execute(query: GetAboutFailureByIdQuery): Promise<AboutFailureDto> {
    IdentifierValue.from(query.failureId);

    const failure = await this.repo.findById(query.failureId);
    if (!failure)
      throw NotFoundError('AboutFailure not found', {
        errorCode: AboutFailureErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return AboutFailurePresenter.toResponse(failure);
  }
}
