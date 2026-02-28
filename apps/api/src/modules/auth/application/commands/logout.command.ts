import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer, AuthErrorCode } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';

export class LogoutCommand extends BaseCommand {
  constructor(readonly targetUserId: string) {
    super(targetUserId);
  }
}

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: LogoutCommand): Promise<void> {
    IdentifierValue.from(command.targetUserId);
    const user = await this.repo.findById(command.targetUserId);
    if (!user)
      throw NotFoundError('User not found', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.UNAUTHORIZED,
      });

    const updated = user.clearRefreshToken();
    await this.repo.update(user.id, updated);
  }
}
