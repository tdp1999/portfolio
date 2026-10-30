import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ErrorLayer, MedicalItemErrorCode, ValidationError } from '@portfolio/shared/errors';
import type { MedicalItemDto, PaginatedResult } from '@portfolio/shared/types';
import { MedicalItemQuerySchema } from '../medical-item.dto';
import { MedicineCabinetPresenter } from '../medicine-cabinet.presenter';
import { IMedicalItemRepository } from '../ports/medical-item.repository.port';
import { MEDICAL_ITEM_REPOSITORY } from '../medicine-cabinet.token';

export class ListMedicalItemsQuery {
  constructor(readonly params: unknown) {}
}

/** 'S1 Danh sách sản phẩm': newest `updatedAt` first, optionally one person only (R10.1, R10.2). */
@QueryHandler(ListMedicalItemsQuery)
export class ListMedicalItemsHandler implements IQueryHandler<ListMedicalItemsQuery> {
  constructor(@Inject(MEDICAL_ITEM_REPOSITORY) private readonly items: IMedicalItemRepository) {}

  async execute(
    query: ListMedicalItemsQuery
  ): Promise<PaginatedResult<MedicalItemDto> & { page: number; limit: number }> {
    const { success, data, error } = MedicalItemQuerySchema.safeParse(query.params);
    if (!success)
      throw ValidationError(error, {
        errorCode: MedicalItemErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'List medical items query validation failed',
      });

    const { data: items, total } = await this.items.findAll(data);
    return { data: items.map(MedicineCabinetPresenter.toItem), total, page: data.page, limit: data.limit };
  }
}
