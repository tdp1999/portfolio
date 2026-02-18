import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BadRequestError, NotFoundError, ErrorLayer } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';
import { UpdateUserSchema } from '../user.dto';
import { UserErrorCode } from '../user-error-code';

export class UpdateUserCommand extends BaseCommand {
  constructor(
    readonly targetUserId: string,
    readonly dto: unknown
  ) {
    super(targetUserId);
  }
}

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: UpdateUserCommand): Promise<void> {
    IdentifierValue.from(command.targetUserId);
    const { success, data, error } = UpdateUserSchema.safeParse(command.dto);
    if (!success)
      throw BadRequestError(error, {
        layer: ErrorLayer.APPLICATION,
        remarks: 'User update failed',
      });

    const user = await this.repo.findById(command.targetUserId);
    if (!user)
      throw NotFoundError('User not found', {
        layer: ErrorLayer.APPLICATION,
        errorCode: UserErrorCode.NOT_FOUND,
      });

    const updated = user.updateProfile(data);
    await this.repo.update(command.targetUserId, updated);
  }
}
