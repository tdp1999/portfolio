import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, AboutPrincipleErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IAboutPrincipleRepository } from '../ports/about-principle.repository.port';
import { ABOUT_PRINCIPLE_REPOSITORY } from '../about-principle.token';
import { UpdateAboutPrincipleSchema } from '../about-principle.dto';
import { MarkProfileContentUpdatedCommand } from '../../../profile/application/commands';

export class UpdateAboutPrincipleCommand extends BaseCommand {
  constructor(
    readonly principleId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateAboutPrincipleCommand)
export class UpdateAboutPrincipleHandler implements ICommandHandler<UpdateAboutPrincipleCommand> {
  constructor(
    @Inject(ABOUT_PRINCIPLE_REPOSITORY) private readonly repo: IAboutPrincipleRepository,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: UpdateAboutPrincipleCommand): Promise<void> {
    IdentifierValue.from(command.principleId);

    const { success, data, error } = UpdateAboutPrincipleSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: AboutPrincipleErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'AboutPrinciple update validation failed',
      });

    const principle = await this.repo.findById(command.principleId);
    if (!principle)
      throw NotFoundError('AboutPrinciple not found', {
        errorCode: AboutPrincipleErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const updated = principle.update(data);
    await this.repo.update(command.principleId, updated);
    await this.commandBus.execute(new MarkProfileContentUpdatedCommand(command.userId));
  }
}
