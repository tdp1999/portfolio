import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, AboutFailureErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { AboutFailure } from '../../domain/entities/about-failure.entity';
import { IAboutFailureRepository } from '../ports/about-failure.repository.port';
import { ABOUT_FAILURE_REPOSITORY } from '../about-failure.token';
import { CreateAboutFailureSchema } from '../about-failure.dto';
import { MarkProfileContentUpdatedCommand } from '../../../profile/application/commands';

export class CreateAboutFailureCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(CreateAboutFailureCommand)
export class CreateAboutFailureHandler implements ICommandHandler<CreateAboutFailureCommand> {
  constructor(
    @Inject(ABOUT_FAILURE_REPOSITORY) private readonly repo: IAboutFailureRepository,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: CreateAboutFailureCommand): Promise<string> {
    const { success, data, error } = CreateAboutFailureSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: AboutFailureErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'AboutFailure creation validation failed',
      });

    const failure = AboutFailure.create(data);
    const id = await this.repo.add(failure);
    await this.commandBus.execute(new MarkProfileContentUpdatedCommand(command.userId));
    return id;
  }
}
