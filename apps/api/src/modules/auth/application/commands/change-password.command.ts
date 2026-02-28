import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BadRequestError, ValidationError, NotFoundError, ErrorLayer, AuthErrorCode } from '@portfolio/shared/errors';
import { comparePassword, hashPassword } from '@portfolio/shared/utils';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { ChangePasswordSchema } from '../auth.dto';

export class ChangePasswordCommand extends BaseCommand {
  constructor(
    readonly targetUserId: string,
    readonly dto: unknown
  ) {
    super(targetUserId);
  }
}

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: ChangePasswordCommand): Promise<void> {
    const { success, data, error } = ChangePasswordSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: AuthErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Change password validation failed',
      });

    IdentifierValue.from(command.targetUserId);
    const user = await this.repo.findById(command.targetUserId);
    if (!user)
      throw NotFoundError('User not found', {
        errorCode: AuthErrorCode.UNAUTHORIZED,
        layer: ErrorLayer.APPLICATION,
      });

    if (!user.password)
      throw BadRequestError('Account uses Google sign-in. Set a password via forgot-password flow.', {
        errorCode: AuthErrorCode.NO_PASSWORD,
        layer: ErrorLayer.APPLICATION,
      });

    const passwordValid = await comparePassword(data.currentPassword, user.password);
    if (!passwordValid)
      throw BadRequestError('Current password is incorrect', {
        errorCode: AuthErrorCode.WRONG_PASSWORD,
        layer: ErrorLayer.APPLICATION,
      });

    const hashedPassword = await hashPassword(data.newPassword);
    let updated = user.updatePassword(hashedPassword);
    updated = updated.incrementTokenVersion();
    await this.repo.update(user.id, updated);
  }
}
