import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, Inject } from '@nestjs/common';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';
import { CreateUserSchema } from '../user.dto';

export class CreateUserCommand extends BaseCommand {
  constructor(readonly dto: unknown) {
    super('system');
  }
}

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: CreateUserCommand): Promise<string> {
    const { success, data, error } = CreateUserSchema.safeParse(command.dto);
    if (!success) throw new BadRequestException(error.issues);

    const user = User.create({
      email: data.email,
      passwordHash: data.password,
      name: data.name,
    });
    return this.repo.add(user);
  }
}
