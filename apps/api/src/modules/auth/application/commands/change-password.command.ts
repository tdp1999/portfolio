import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BadRequestError, NotFoundError, ErrorLayer } from '@portfolio/shared/errors';
import { comparePassword, hashPassword } from '@portfolio/shared/utils';
import { IdentifierValue } from '@portfolio/shared/types';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { ChangePasswordSchema } from '../auth.dto';
import { AuthErrorCode } from '../auth-error-code';

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
      throw BadRequestError(error, {
        layer: ErrorLayer.APPLICATION,
        remarks: 'Change password validation failed',
      });

    IdentifierValue.from(command.targetUserId);
    const user = await this.repo.findById(command.targetUserId);
    if (!user)
      throw NotFoundError('User not found', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.UNAUTHORIZED,
      });

    if (!user.password)
      throw BadRequestError(
        'Account uses Google sign-in. Set a password via forgot-password flow.',
        {
          layer: ErrorLayer.APPLICATION,
          errorCode: AuthErrorCode.NO_PASSWORD,
        }
      );

    const passwordValid = await comparePassword(data.currentPassword, user.password);
    if (!passwordValid)
      throw BadRequestError('Current password is incorrect', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.WRONG_PASSWORD,
      });

    const hashedPassword = await hashPassword(data.newPassword);
    let updated = user.updatePassword(hashedPassword);
    updated = updated.incrementTokenVersion();
    await this.repo.update(user.id, updated);
  }
}
