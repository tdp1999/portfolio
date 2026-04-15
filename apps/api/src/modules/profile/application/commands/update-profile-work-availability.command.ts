import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import type { OpenToValue } from '@portfolio/shared/types';
import { WorkAvailability } from '../../domain/value-objects';
import { UpdateProfileWorkAvailabilitySchema } from '../schemas';

export class UpdateProfileWorkAvailabilityCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateProfileWorkAvailabilityCommand)
export class UpdateProfileWorkAvailabilityHandler implements ICommandHandler<UpdateProfileWorkAvailabilityCommand> {
  constructor(@Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository) {}

  async execute(command: UpdateProfileWorkAvailabilityCommand): Promise<void> {
    const { success, data, error } = UpdateProfileWorkAvailabilitySchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Update profile work availability validation failed',
      });

    const profile = await this.repo.findByUserId(command.userId);
    if (!profile)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const newWorkAvailability = WorkAvailability.create({
      yearsOfExperience: data.yearsOfExperience,
      availability: data.availability,
      openTo: data.openTo as OpenToValue[],
      timezone: data.timezone,
    });
    const updated = profile.withWorkAvailability(newWorkAvailability, command.userId);
    await this.repo.updateWorkAvailability(command.userId, updated.workAvailability, command.userId);
  }
}
