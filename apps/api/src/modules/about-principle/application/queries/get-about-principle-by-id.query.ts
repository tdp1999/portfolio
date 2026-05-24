import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, AboutPrincipleErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { IAboutPrincipleRepository } from '../ports/about-principle.repository.port';
import { ABOUT_PRINCIPLE_REPOSITORY } from '../about-principle.token';
import { AboutPrincipleDto } from '../about-principle.dto';
import { AboutPrinciplePresenter } from '../about-principle.presenter';

export class GetAboutPrincipleByIdQuery {
  constructor(readonly principleId: string) {}
}

@QueryHandler(GetAboutPrincipleByIdQuery)
export class GetAboutPrincipleByIdHandler implements IQueryHandler<GetAboutPrincipleByIdQuery> {
  constructor(@Inject(ABOUT_PRINCIPLE_REPOSITORY) private readonly repo: IAboutPrincipleRepository) {}

  async execute(query: GetAboutPrincipleByIdQuery): Promise<AboutPrincipleDto> {
    IdentifierValue.from(query.principleId);

    const principle = await this.repo.findById(query.principleId);
    if (!principle)
      throw NotFoundError('AboutPrinciple not found', {
        errorCode: AboutPrincipleErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    return AboutPrinciplePresenter.toResponse(principle);
  }
}
