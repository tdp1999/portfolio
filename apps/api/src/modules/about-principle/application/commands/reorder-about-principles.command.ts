import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, BadRequestError, ErrorLayer, AboutPrincipleErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IAboutPrincipleRepository } from '../ports/about-principle.repository.port';
import { ABOUT_PRINCIPLE_REPOSITORY } from '../about-principle.token';
import { ReorderAboutPrinciplesSchema } from '../about-principle.dto';
import { MarkProfileContentUpdatedCommand } from '../../../profile/application/commands';

/**
 * Reorder takes the full ordered list of principle ids; the array position
 * becomes the new `order` value (0-indexed). Caller is responsible for
 * including every published principle id — partial reorders are rejected
 * because they would leave the list in an ambiguous state.
 */
export class ReorderAboutPrinciplesCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(ReorderAboutPrinciplesCommand)
export class ReorderAboutPrinciplesHandler implements ICommandHandler<ReorderAboutPrinciplesCommand> {
  constructor(
    @Inject(ABOUT_PRINCIPLE_REPOSITORY) private readonly repo: IAboutPrincipleRepository,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: ReorderAboutPrinciplesCommand): Promise<void> {
    const { success, data, error } = ReorderAboutPrinciplesSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: AboutPrincipleErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'AboutPrinciple reorder validation failed',
      });

    const existing = await this.repo.findAll();
    const existingIds = new Set(existing.map((p) => p.id));
    const incomingIds = new Set(data.ids);

    if (data.ids.length !== existing.length || data.ids.some((id) => !existingIds.has(id))) {
      throw BadRequestError('Reorder payload must contain exactly the set of existing principle ids', {
        errorCode: AboutPrincipleErrorCode.REORDER_ID_MISMATCH,
        layer: ErrorLayer.APPLICATION,
      });
    }
    if (incomingIds.size !== data.ids.length) {
      throw BadRequestError('Reorder payload contains duplicate ids', {
        errorCode: AboutPrincipleErrorCode.REORDER_ID_MISMATCH,
        layer: ErrorLayer.APPLICATION,
      });
    }

    const updates = data.ids.map((id, index) => ({ id, order: index }));
    await this.repo.reorder(updates);
    await this.commandBus.execute(new MarkProfileContentUpdatedCommand(command.userId));
  }
}
