import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';

export class CreateUserCommand extends BaseCommand {
  constructor(
    readonly email: string,
    readonly passwordHash: string,
    readonly name: string
  ) {
    super('system');
  }
}

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const user = User.create({
      email: command.email,
      passwordHash: command.passwordHash,
      name: command.name,
    });
    return this.repo.add(user);
  }
}
