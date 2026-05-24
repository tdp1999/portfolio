import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, AboutPrincipleErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { AboutPrinciple } from '../../domain/entities/about-principle.entity';
import { IAboutPrincipleRepository } from '../ports/about-principle.repository.port';
import { ABOUT_PRINCIPLE_REPOSITORY } from '../about-principle.token';
import { CreateAboutPrincipleSchema } from '../about-principle.dto';
import { MarkProfileContentUpdatedCommand } from '../../../profile/application/commands';

export class CreateAboutPrincipleCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    userId: string
  ) {
    super(userId);
  }
}

@CommandHandler(CreateAboutPrincipleCommand)
export class CreateAboutPrincipleHandler implements ICommandHandler<CreateAboutPrincipleCommand> {
  constructor(
    @Inject(ABOUT_PRINCIPLE_REPOSITORY) private readonly repo: IAboutPrincipleRepository,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: CreateAboutPrincipleCommand): Promise<string> {
    const { success, data, error } = CreateAboutPrincipleSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: AboutPrincipleErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'AboutPrinciple creation validation failed',
      });

    const principle = AboutPrinciple.create(data);
    const id = await this.repo.add(principle);
    await this.commandBus.execute(new MarkProfileContentUpdatedCommand(command.userId));
    return id;
  }
}
