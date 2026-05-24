import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, NotFoundError, ErrorLayer, AboutFailureErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IAboutFailureRepository } from '../ports/about-failure.repository.port';
import { ABOUT_FAILURE_REPOSITORY } from '../about-failure.token';
import { UpdateAboutFailureSchema } from '../about-failure.dto';
import { MarkProfileContentUpdatedCommand } from '../../../profile/application/commands';

export class UpdateAboutFailureCommand extends BaseCommand {
  constructor(
    readonly failureId: string,
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(UpdateAboutFailureCommand)
export class UpdateAboutFailureHandler implements ICommandHandler<UpdateAboutFailureCommand> {
  constructor(
    @Inject(ABOUT_FAILURE_REPOSITORY) private readonly repo: IAboutFailureRepository,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: UpdateAboutFailureCommand): Promise<void> {
    IdentifierValue.from(command.failureId);

    const { success, data, error } = UpdateAboutFailureSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'AboutFailure update validation failed',
      });

    const failure = await this.repo.findById(command.failureId);
    if (!failure)
      throw NotFoundError('AboutFailure not found', {
        errorCode: AboutFailureErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    const updated = failure.update(data);
    await this.repo.update(command.failureId, updated);
    await this.commandBus.execute(new MarkProfileContentUpdatedCommand(command.userId));
  }
}
