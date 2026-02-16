import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';

export class UpdateLastLoginCommand extends BaseCommand {
  constructor(readonly targetUserId: string) {
    super(targetUserId);
  }
}

@CommandHandler(UpdateLastLoginCommand)
export class UpdateLastLoginHandler implements ICommandHandler<UpdateLastLoginCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: UpdateLastLoginCommand): Promise<void> {
    const user = await this.repo.findById(command.targetUserId);
    if (!user) throw new NotFoundException('User not found');

    const updated = user.updateLastLogin();
    await this.repo.update(command.targetUserId, updated);
  }
}
