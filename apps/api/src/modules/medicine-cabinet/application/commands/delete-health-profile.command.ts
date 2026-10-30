import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { healthProfileNotFound } from '../medicine-cabinet.errors';
import { IHealthProfileRepository } from '../ports/health-profile.repository.port';
import { HEALTH_PROFILE_REPOSITORY } from '../medicine-cabinet.token';

export class DeleteHealthProfileCommand extends BaseCommand {
  constructor(
    readonly profileId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(DeleteHealthProfileCommand)
export class DeleteHealthProfileHandler implements ICommandHandler<DeleteHealthProfileCommand> {
  constructor(@Inject(HEALTH_PROFILE_REPOSITORY) private readonly profiles: IHealthProfileRepository) {}

  async execute(command: DeleteHealthProfileCommand): Promise<void> {
    IdentifierValue.from(command.profileId);

    // A person already deleted in another tab gives 404; the console treats that as done (R13.11).
    const profile = await this.profiles.findById(command.profileId);
    if (!profile) throw healthProfileNotFound();

    // The person and every item of theirs are soft deleted in one transaction (Q-11).
    await this.profiles.removeWithItems(command.profileId, profile.softDelete(command.userId));
  }
}
