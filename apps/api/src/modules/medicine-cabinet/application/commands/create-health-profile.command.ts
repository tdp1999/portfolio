import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ErrorLayer, HealthProfileErrorCode, ValidationError } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { HealthProfile } from '../../domain/entities/health-profile.entity';
import { CreateHealthProfileSchema } from '../health-profile.dto';
import { profileNameTaken } from '../medicine-cabinet.errors';
import { IHealthProfileRepository } from '../ports/health-profile.repository.port';
import { HEALTH_PROFILE_REPOSITORY } from '../medicine-cabinet.token';

export class CreateHealthProfileCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(CreateHealthProfileCommand)
export class CreateHealthProfileHandler implements ICommandHandler<CreateHealthProfileCommand> {
  constructor(@Inject(HEALTH_PROFILE_REPOSITORY) private readonly profiles: IHealthProfileRepository) {}

  async execute(command: CreateHealthProfileCommand): Promise<string> {
    const { success, data, error } = CreateHealthProfileSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: HealthProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Health profile creation validation failed',
      });

    // `findByName` ignores letter case and skips deleted people, so a deleted name can be reused (P9).
    if (await this.profiles.findByName(data.name)) throw profileNameTaken();

    return this.profiles.add(HealthProfile.create(data, command.userId));
  }
}
