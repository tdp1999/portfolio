import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { BadRequestError, UnauthorizedError, ErrorLayer } from '@portfolio/shared/errors';
import { hashPassword } from '@portfolio/shared/utils';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { ResetPasswordSchema } from '../auth.dto';
import { AuthErrorCode } from '../auth-error-code';

export class ResetPasswordCommand {
  constructor(readonly dto: unknown) {}
}

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, void> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const { success, data, error } = ResetPasswordSchema.safeParse(command.dto);
    if (!success)
      throw BadRequestError(error, {
        layer: ErrorLayer.APPLICATION,
        remarks: 'Reset password validation failed',
      });

    const user = await this.repo.findById(data.userId);
    if (!user || !user.passwordResetToken || !user.passwordResetExpiresAt)
      throw UnauthorizedError('Invalid or expired reset token', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_RESET_TOKEN,
      });

    const hashedToken = createHash('sha256').update(data.token).digest('hex');
    if (hashedToken !== user.passwordResetToken)
      throw UnauthorizedError('Invalid or expired reset token', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_RESET_TOKEN,
      });

    if (user.passwordResetExpiresAt < new Date())
      throw UnauthorizedError('Reset token has expired', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.RESET_TOKEN_EXPIRED,
      });

    const hashedPassword = await hashPassword(data.newPassword);
    let updated = user.updatePassword(hashedPassword);
    updated = updated.clearPasswordResetToken();
    updated = updated.incrementTokenVersion();
    await this.repo.update(user.id, updated);
  }
}
