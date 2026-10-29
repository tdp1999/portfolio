import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import type { MedicalItemDto } from '@portfolio/shared/types';
import { IdentifierValue } from '@portfolio/shared/types';
import { medicalItemNotFound } from '../medicine-cabinet.errors';
import { MedicineCabinetPresenter } from '../medicine-cabinet.presenter';
import { IMedicalItemRepository } from '../ports/medical-item.repository.port';
import { MEDICAL_ITEM_REPOSITORY } from '../medicine-cabinet.token';

export class GetMedicalItemQuery {
  constructor(readonly itemId: string) {}
}

/** 'S2 Form sản phẩm'. A deleted item gives 404, and the form shows "This item no longer exists" (R13.4). */
@QueryHandler(GetMedicalItemQuery)
export class GetMedicalItemHandler implements IQueryHandler<GetMedicalItemQuery> {
  constructor(@Inject(MEDICAL_ITEM_REPOSITORY) private readonly items: IMedicalItemRepository) {}

  async execute(query: GetMedicalItemQuery): Promise<MedicalItemDto> {
    IdentifierValue.from(query.itemId);
    const item = await this.items.findById(query.itemId);
    if (!item) throw medicalItemNotFound();
    return MedicineCabinetPresenter.toItem(item);
  }
}
