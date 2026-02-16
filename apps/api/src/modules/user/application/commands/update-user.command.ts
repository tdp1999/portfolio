import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';
import { UpdateUserDto } from '../user.dto';

export class UpdateUserCommand extends BaseCommand {
  constructor(
    readonly targetUserId: string,
    readonly data: UpdateUserDto
  ) {
    super(targetUserId);
  }
}

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: UpdateUserCommand): Promise<void> {
    const user = await this.repo.findById(command.targetUserId);
    if (!user) throw new NotFoundException('User not found');

    const updated = user.updateProfile(command.data);
    await this.repo.update(command.targetUserId, updated);
  }
}
