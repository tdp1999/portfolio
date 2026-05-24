import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, AboutFailureErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IAboutFailureRepository } from '../ports/about-failure.repository.port';
import { ABOUT_FAILURE_REPOSITORY } from '../about-failure.token';
import { MarkProfileContentUpdatedCommand } from '../../../profile/application/commands';

export class DeleteAboutFailureCommand extends BaseCommand {
  constructor(
    readonly failureId: string,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(DeleteAboutFailureCommand)
export class DeleteAboutFailureHandler implements ICommandHandler<DeleteAboutFailureCommand> {
  constructor(
    @Inject(ABOUT_FAILURE_REPOSITORY) private readonly repo: IAboutFailureRepository,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: DeleteAboutFailureCommand): Promise<void> {
    IdentifierValue.from(command.failureId);

    const existing = await this.repo.findById(command.failureId);
    if (!existing)
      throw NotFoundError('AboutFailure not found', {
        errorCode: AboutFailureErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    await this.repo.delete(command.failureId);
    await this.commandBus.execute(new MarkProfileContentUpdatedCommand(command.userId));
  }
}
