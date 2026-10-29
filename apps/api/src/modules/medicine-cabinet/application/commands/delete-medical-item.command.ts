import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { medicalItemNotFound } from '../medicine-cabinet.errors';
import { IMedicalItemRepository } from '../ports/medical-item.repository.port';
import { MEDICAL_ITEM_REPOSITORY } from '../medicine-cabinet.token';

export class DeleteMedicalItemCommand extends BaseCommand {
  constructor(
    readonly itemId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(DeleteMedicalItemCommand)
export class DeleteMedicalItemHandler implements ICommandHandler<DeleteMedicalItemCommand> {
  constructor(@Inject(MEDICAL_ITEM_REPOSITORY) private readonly items: IMedicalItemRepository) {}

  async execute(command: DeleteMedicalItemCommand): Promise<void> {
    IdentifierValue.from(command.itemId);

    // An item already deleted on another device gives 404; the console treats that as done (R13.9).
    const item = await this.items.findById(command.itemId);
    if (!item) throw medicalItemNotFound();

    await this.items.remove(command.itemId, item.softDelete(command.userId));
  }
}
