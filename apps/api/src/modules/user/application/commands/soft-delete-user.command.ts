import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, BadRequestError, ErrorLayer, UserErrorCode } from '@portfolio/shared/errors';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';

export class SoftDeleteUserCommand {
  constructor(readonly userId: string) {}
}

@CommandHandler(SoftDeleteUserCommand)
export class SoftDeleteUserHandler implements ICommandHandler<SoftDeleteUserCommand, void> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: SoftDeleteUserCommand): Promise<void> {
    const user = await this.repo.findById(command.userId);
    if (!user)
      throw NotFoundError('User not found', {
        errorCode: UserErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (user.deletedAt)
      throw BadRequestError('User is already deleted', {
        errorCode: UserErrorCode.ALREADY_DELETED,
        layer: ErrorLayer.APPLICATION,
      });

    let updated = user.softDelete();
    updated = updated.clearRefreshToken();
    updated = updated.incrementTokenVersion();
    await this.repo.update(user.id, updated);
  }
}
