import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

import { ErrorLayer, NotFoundError, RadarErrorCode, ValidationError } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';

import { RadarBrief } from '../../domain/entities/radar-brief.entity';
import { IRadarBriefRepository } from '../ports/radar-brief.repository.port';
import { IRadarSourceRepository } from '../ports/radar-source.repository.port';
import {
  BRIEF_LIST_LIMIT,
  ListBriefItemsSchema,
  RadarBriefDetailDto,
  RadarBriefDto,
  RadarBriefItemsPageDto,
} from '../radar.dto';
import { RadarPresenter } from '../radar.presenter';
import { RADAR_BRIEF_REPOSITORY, RADAR_SOURCE_REPOSITORY } from '../radar.token';

/** Briefs are asked for by hand, a few a month, so the newest 50 cover the Briefs page. */
export class ListBriefsQuery {}

@QueryHandler(ListBriefsQuery)
export class ListBriefsHandler implements IQueryHandler<ListBriefsQuery> {
  constructor(@Inject(RADAR_BRIEF_REPOSITORY) private readonly briefs: IRadarBriefRepository) {}

  async execute(): Promise<RadarBriefDto[]> {
    return (await this.briefs.list(BRIEF_LIST_LIMIT)).map(RadarPresenter.toBrief);
  }
}

export class GetBriefQuery {
  constructor(readonly briefId: string) {}
}

@QueryHandler(GetBriefQuery)
export class GetBriefHandler implements IQueryHandler<GetBriefQuery> {
  constructor(
    @Inject(RADAR_BRIEF_REPOSITORY) private readonly briefs: IRadarBriefRepository,
    @Inject(RADAR_SOURCE_REPOSITORY) private readonly sources: IRadarSourceRepository
  ) {}

  async execute(query: GetBriefQuery): Promise<RadarBriefDetailDto> {
    const brief = await findBrief(this.briefs, query.briefId);
    const source = brief.sourceId ? await this.sources.findById(brief.sourceId) : null;
    return RadarPresenter.toBriefDetail(brief, source?.displayName ?? null);
  }
}

/** The window's analyzed posts, a page at a time, for the worker writing the brief. */
export class ListBriefItemsQuery {
  constructor(
    readonly briefId: string,
    readonly dto: unknown
  ) {}
}

@QueryHandler(ListBriefItemsQuery)
export class ListBriefItemsHandler implements IQueryHandler<ListBriefItemsQuery> {
  constructor(@Inject(RADAR_BRIEF_REPOSITORY) private readonly briefs: IRadarBriefRepository) {}

  async execute(query: ListBriefItemsQuery): Promise<RadarBriefItemsPageDto> {
    const { success, data, error } = ListBriefItemsSchema.safeParse(query.dto ?? {});
    if (!success) {
      throw ValidationError(error, { errorCode: RadarErrorCode.INVALID_INPUT, layer: ErrorLayer.APPLICATION });
    }
    const brief = await findBrief(this.briefs, query.briefId);
    const { items, total } = await this.briefs.windowItems(brief, data.offset, data.limit);
    const next = data.offset + data.limit;
    return { items: items.map(RadarPresenter.toBriefWorkItem), total, nextOffset: next < total ? next : null };
  }
}

async function findBrief(briefs: IRadarBriefRepository, id: string): Promise<RadarBrief> {
  IdentifierValue.from(id);
  const brief = await briefs.findById(id);
  if (!brief) {
    throw NotFoundError('Radar brief not found', {
      errorCode: RadarErrorCode.BRIEF_NOT_FOUND,
      layer: ErrorLayer.APPLICATION,
    });
  }
  return brief;
}
