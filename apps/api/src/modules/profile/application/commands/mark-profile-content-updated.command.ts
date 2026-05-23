import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, ProfileErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IProfileRepository } from '../ports/profile.repository.port';
import { PROFILE_REPOSITORY } from '../profile.token';

/**
 * Author-triggered bump of `Profile.contentUpdatedAt` to "now". Drives the
 * /about hero "Last updated" timestamp — kept separate from `updatedAt`
 * (which bumps on every DB write) so the visible date tracks narrative-edit
 * cadence, not avatar swaps or social-link tweaks.
 */
export class MarkProfileContentUpdatedCommand extends BaseCommand {
  constructor(userId: string) {
    super(userId);
  }
}

@CommandHandler(MarkProfileContentUpdatedCommand)
export class MarkProfileContentUpdatedHandler implements ICommandHandler<MarkProfileContentUpdatedCommand> {
  constructor(@Inject(PROFILE_REPOSITORY) private readonly repo: IProfileRepository) {}

  async execute(command: MarkProfileContentUpdatedCommand): Promise<{ contentUpdatedAt: string }> {
    const profile = await this.repo.findByUserId(command.userId);
    if (!profile)
      throw NotFoundError('Profile not found', {
        errorCode: ProfileErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const updated = profile.markContentUpdated(command.userId);
    // The entity getter stays `Date | null` because a freshly-loaded profile
    // can legitimately be null; after `markContentUpdated()` it cannot. Narrow
    // explicitly rather than asserting so a future regression in the mutator
    // would surface as a thrown invariant, not a silent runtime crash.
    const stamp = updated.contentUpdatedAt;
    if (!stamp) throw new Error('markContentUpdated invariant: stamp must be set');
    await this.repo.markContentUpdated(command.userId, stamp, command.userId);
    return { contentUpdatedAt: stamp.toISOString() };
  }
}
