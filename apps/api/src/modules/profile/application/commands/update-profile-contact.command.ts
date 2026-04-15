import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';
import { Contact } from '../../domain/value-objects';
import { UpdateProfileContactSchema } from '../schemas';

export class UpdateProfileContactCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateProfileContactCommand)
export class UpdateProfileContactHandler implements ICommandHandler<UpdateProfileContactCommand> {
  constructor(@Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository) {}

  async execute(command: UpdateProfileContactCommand): Promise<void> {
    const { success, data, error } = UpdateProfileContactSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: ProfileErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Update profile contact validation failed',
      });

    const profile = await this.repo.findByUserId(command.userId);
    if (!profile)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const newContact = Contact.create({
      email: data.email,
      phone: data.phone,
      preferredContactPlatform: data.preferredContactPlatform,
      preferredContactValue: data.preferredContactValue,
    });
    const updated = profile.withContact(newContact, command.userId);
    await this.repo.updateContact(command.userId, updated.contact, command.userId);
  }
}
