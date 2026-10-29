import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { MedicineLookupItem } from '@portfolio/shared/types';
import { MedicineCabinetPresenter } from '../medicine-cabinet.presenter';
import { IMedicalItemRepository } from '../ports/medical-item.repository.port';
import { MEDICAL_ITEM_REPOSITORY } from '../medicine-cabinet.token';

export class ListLookupItemsQuery {}

/** 'S6 Trang tra cứu': every item not deleted with its person's name, in one response. The page filters. */
@QueryHandler(ListLookupItemsQuery)
export class ListLookupItemsHandler implements IQueryHandler<ListLookupItemsQuery> {
  constructor(@Inject(MEDICAL_ITEM_REPOSITORY) private readonly items: IMedicalItemRepository) {}

  async execute(_query: ListLookupItemsQuery): Promise<MedicineLookupItem[]> {
    const rows = await this.items.findLookup();
    return rows.map(({ item, profileName }) => MedicineCabinetPresenter.toLookupItem(item, profileName));
  }
}
