import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { Location } from '../../domain/value-objects';
import { UpdateProfileLocationSchema } from '../schemas';

export class UpdateProfileLocationCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateProfileLocationCommand)
export class UpdateProfileLocationHandler implements ICommandHandler<UpdateProfileLocationCommand> {
  constructor(@Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository) {}

  async execute(command: UpdateProfileLocationCommand): Promise<void> {
    const { success, data, error } = UpdateProfileLocationSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Update profile location validation failed',
      });

    const profile = await this.repo.findByUserId(command.userId);
    if (!profile)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const newLocation = Location.create({
      country: data.locationCountry,
      city: data.locationCity,
      postalCode: data.locationPostalCode,
      address1: data.locationAddress1,
      address2: data.locationAddress2,
    });
    const updated = profile.withLocation(newLocation, command.userId);
    await this.repo.updateLocation(command.userId, updated.location, command.userId);
  }
}
