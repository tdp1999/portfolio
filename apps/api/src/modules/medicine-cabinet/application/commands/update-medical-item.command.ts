import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ErrorLayer, MedicalItemErrorCode, ValidationError } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { MEDICINE_ONLY_FIELDS, MEDICINE_ONLY_MESSAGE, UpdateMedicalItemSchema } from '../medical-item.dto';
import { assertProfileExists, medicalItemFieldError, medicalItemNotFound } from '../medicine-cabinet.errors';
import { IHealthProfileRepository } from '../ports/health-profile.repository.port';
import { IMedicalItemRepository } from '../ports/medical-item.repository.port';
import { HEALTH_PROFILE_REPOSITORY, MEDICAL_ITEM_REPOSITORY } from '../medicine-cabinet.token';
import { toUpdatePayload } from './medical-item.payload';

export class UpdateMedicalItemCommand extends BaseCommand {
  constructor(
    readonly itemId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateMedicalItemCommand)
export class UpdateMedicalItemHandler implements ICommandHandler<UpdateMedicalItemCommand> {
  constructor(
    @Inject(MEDICAL_ITEM_REPOSITORY) private readonly items: IMedicalItemRepository,
    @Inject(HEALTH_PROFILE_REPOSITORY) private readonly profiles: IHealthProfileRepository
  ) {}

  async execute(command: UpdateMedicalItemCommand): Promise<void> {
    IdentifierValue.from(command.itemId);

    const { success, data, error } = UpdateMedicalItemSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: MedicalItemErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Medical item update validation failed',
      });

    // Deleted items are skipped, so an item deleted alone or with its person gives 404 (R13.10).
    const item = await this.items.findById(command.itemId);
    if (!item) throw medicalItemNotFound();

    // The PATCH schema cannot know the stored kind, so a supply is checked here (Q-48).
    if (item.kind === 'SUPPLY') {
      const sent = MEDICINE_ONLY_FIELDS.find((field) => data[field] !== undefined);
      if (sent) throw medicalItemFieldError(sent, MEDICINE_ONLY_MESSAGE);
    }

    if (data.profileId) await assertProfileExists(this.profiles, data.profileId);

    await this.items.update(command.itemId, item.update(toUpdatePayload(data), command.userId));
  }
}
