import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { AuthErrorCode } from '../auth-error-code';

export class LogoutAllCommand extends BaseCommand {
  constructor(readonly targetUserId: string) {
    super(targetUserId);
  }
}

@CommandHandler(LogoutAllCommand)
export class LogoutAllHandler implements ICommandHandler<LogoutAllCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: LogoutAllCommand): Promise<void> {
    IdentifierValue.from(command.targetUserId);
    const user = await this.repo.findById(command.targetUserId);
    if (!user)
      throw NotFoundError('User not found', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.UNAUTHORIZED,
      });

    let updated = user.incrementTokenVersion();
    updated = updated.clearRefreshToken();
    await this.repo.update(user.id, updated);
  }
}
