import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, AboutPrincipleErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IAboutPrincipleRepository } from '../ports/about-principle.repository.port';
import { ABOUT_PRINCIPLE_REPOSITORY } from '../about-principle.token';
import { MarkProfileContentUpdatedCommand } from '../../../profile/application/commands';

export class DeleteAboutPrincipleCommand extends BaseCommand {
  constructor(
    readonly principleId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(DeleteAboutPrincipleCommand)
export class DeleteAboutPrincipleHandler implements ICommandHandler<DeleteAboutPrincipleCommand> {
  constructor(
    @Inject(ABOUT_PRINCIPLE_REPOSITORY) private readonly repo: IAboutPrincipleRepository,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: DeleteAboutPrincipleCommand): Promise<void> {
    IdentifierValue.from(command.principleId);

    const existing = await this.repo.findById(command.principleId);
    if (!existing)
      throw NotFoundError('AboutPrinciple not found', {
        errorCode: AboutPrincipleErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    await this.repo.delete(command.principleId);
    await this.commandBus.execute(new MarkProfileContentUpdatedCommand(command.userId));
  }
}
