import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ErrorLayer, HealthProfileErrorCode, ValidationError } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { RenameHealthProfileSchema } from '../health-profile.dto';
import { healthProfileNotFound, profileNameTaken } from '../medicine-cabinet.errors';
import { IHealthProfileRepository } from '../ports/health-profile.repository.port';
import { HEALTH_PROFILE_REPOSITORY } from '../medicine-cabinet.token';

export class RenameHealthProfileCommand extends BaseCommand {
  constructor(
    readonly profileId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(RenameHealthProfileCommand)
export class RenameHealthProfileHandler implements ICommandHandler<RenameHealthProfileCommand> {
  constructor(@Inject(HEALTH_PROFILE_REPOSITORY) private readonly profiles: IHealthProfileRepository) {}

  async execute(command: RenameHealthProfileCommand): Promise<void> {
    IdentifierValue.from(command.profileId);

    const { success, data, error } = RenameHealthProfileSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: HealthProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Health profile rename validation failed',
      });

    const profile = await this.profiles.findById(command.profileId);
    if (!profile) throw healthProfileNotFound();

    // Renaming a person to their own name in another letter case is allowed (R11.5).
    const sameName = await this.profiles.findByName(data.name);
    if (sameName && sameName.id !== command.profileId) throw profileNameTaken();

    await this.profiles.update(command.profileId, profile.rename(data.name, command.userId));
  }
}
