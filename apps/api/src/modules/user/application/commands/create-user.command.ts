import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BadRequestError, ValidationError, ErrorLayer, UserErrorCode } from '@portfolio/shared/errors';
import { hashPassword } from '@portfolio/shared/utils';
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
    if (!success)
      throw ValidationError(error, {
        errorCode: UserErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'User creation failed',
      });

    const existing = await this.repo.findByEmail(data.email);
    if (existing)
      throw BadRequestError('Email is already taken', {
        errorCode: UserErrorCode.EMAIL_TAKEN,
        layer: ErrorLayer.APPLICATION,
      });

    const hashedPassword = await hashPassword(data.password);
    const user = User.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
    });
    return this.repo.add(user);
  }
}
