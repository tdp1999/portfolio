import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { NotFoundError, ErrorLayer } from '@portfolio/shared/errors';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';
import { UserErrorCode } from '../user-error-code';

export class UpdateLastLoginCommand extends BaseCommand {
  constructor(readonly targetUserId: string) {
    super(targetUserId);
  }
}

@CommandHandler(UpdateLastLoginCommand)
export class UpdateLastLoginHandler implements ICommandHandler<UpdateLastLoginCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: UpdateLastLoginCommand): Promise<void> {
    IdentifierValue.from(command.targetUserId);
    const user = await this.repo.findById(command.targetUserId);
    if (!user)
      throw NotFoundError('User not found', {
        layer: ErrorLayer.APPLICATION,
        errorCode: UserErrorCode.NOT_FOUND,
      });

    const updated = user.updateLastLogin();
    await this.repo.update(command.targetUserId, updated);
  }
}
