import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, BadRequestError, ErrorLayer, AboutFailureErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IAboutFailureRepository } from '../ports/about-failure.repository.port';
import { ABOUT_FAILURE_REPOSITORY } from '../about-failure.token';
import { ReorderAboutFailuresSchema } from '../about-failure.dto';
import { MarkProfileContentUpdatedCommand } from '../../../profile/application/commands';

/**
 * Reorder takes the full ordered list of failure ids; the array position
 * becomes the new `order` value (0-indexed). Caller is responsible for
 * including every existing failure id — partial reorders are rejected
 * because they would leave the list in an ambiguous state.
 */
export class ReorderAboutFailuresCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(ReorderAboutFailuresCommand)
export class ReorderAboutFailuresHandler implements ICommandHandler<ReorderAboutFailuresCommand> {
  constructor(
    @Inject(ABOUT_FAILURE_REPOSITORY) private readonly repo: IAboutFailureRepository,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: ReorderAboutFailuresCommand): Promise<void> {
    const { success, data, error } = ReorderAboutFailuresSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'AboutFailure reorder validation failed',
      });

    const existing = await this.repo.findAll();
    const existingIds = new Set(existing.map((f) => f.id));
    const incomingIds = new Set(data.ids);

    if (data.ids.length !== existing.length || data.ids.some((id) => !existingIds.has(id))) {
      throw BadRequestError('Reorder payload must contain exactly the set of existing failure ids', {
        errorCode: AboutFailureErrorCode.REORDER_ID_MISMATCH,
        layer: ErrorLayer.APPLICATION,
      });
    }
    if (incomingIds.size !== data.ids.length) {
      throw BadRequestError('Reorder payload contains duplicate ids', {
        errorCode: AboutFailureErrorCode.REORDER_ID_MISMATCH,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const updates = data.ids.map((id, index) => ({ id, order: index }));
    await this.repo.reorder(updates);
    await this.commandBus.execute(new MarkProfileContentUpdatedCommand(command.userId));
  }
}
