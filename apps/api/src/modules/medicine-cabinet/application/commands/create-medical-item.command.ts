import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ErrorLayer, MedicalItemErrorCode, ValidationError } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { MedicalItem } from '../../domain/entities/medical-item.entity';
import { CreateMedicalItemSchema } from '../medical-item.dto';
import { assertProfileExists } from '../medicine-cabinet.errors';
import { IHealthProfileRepository } from '../ports/health-profile.repository.port';
import { IMedicalItemRepository } from '../ports/medical-item.repository.port';
import { HEALTH_PROFILE_REPOSITORY, MEDICAL_ITEM_REPOSITORY } from '../medicine-cabinet.token';
import { emptyToNull } from './medical-item.payload';

export class CreateMedicalItemCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(CreateMedicalItemCommand)
export class CreateMedicalItemHandler implements ICommandHandler<CreateMedicalItemCommand> {
  constructor(
    @Inject(MEDICAL_ITEM_REPOSITORY) private readonly items: IMedicalItemRepository,
    @Inject(HEALTH_PROFILE_REPOSITORY) private readonly profiles: IHealthProfileRepository
  ) {}

  async execute(command: CreateMedicalItemCommand): Promise<string> {
    const { success, data, error } = CreateMedicalItemSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: MedicalItemErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Medical item creation validation failed',
      });

    await assertProfileExists(this.profiles, data.profileId);

    const item = MedicalItem.create(
      {
        profileId: data.profileId,
        kind: data.kind,
        name: data.name,
        activeIngredients: data.activeIngredients ?? [],
        strength: data.strength ?? null,
        dose: emptyToNull(data.dose),
        timing: data.timing ?? null,
        usageType: data.usageType ?? null,
        purpose: emptyToNull(data.purpose),
        note: emptyToNull(data.note),
        packForTravel: data.packForTravel ?? false,
      },
      command.userId
    );
    return this.items.add(item);
  }
}
