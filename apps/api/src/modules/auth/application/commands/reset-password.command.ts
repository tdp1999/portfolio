import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { createHash } from 'crypto';
import { ValidationError, BadRequestError, ErrorLayer, AuthErrorCode } from '@portfolio/shared/errors';
import { hashPassword } from '@portfolio/shared/utils';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { ResetPasswordSchema } from '../auth.dto';

export class ResetPasswordCommand {
  constructor(readonly dto: unknown) {}
}

@CommandHandler(ResetPasswordCommand)
export class ResetPasswordHandler implements ICommandHandler<ResetPasswordCommand, void> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: ResetPasswordCommand): Promise<void> {
    const { success, data, error } = ResetPasswordSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: AuthErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Reset password validation failed',
      });

    const user = await this.repo.findById(data.userId);
    if (!user || !user.passwordResetToken || !user.passwordResetExpiresAt)
      throw BadRequestError('Invalid or expired reset token', {
        errorCode: AuthErrorCode.INVALID_RESET_TOKEN,
        layer: ErrorLayer.APPLICATION,
      });

    const hashedToken = createHash('sha256').update(data.token).digest('hex');
    if (hashedToken !== user.passwordResetToken)
      throw BadRequestError('Invalid or expired reset token', {
        errorCode: AuthErrorCode.INVALID_RESET_TOKEN,
        layer: ErrorLayer.APPLICATION,
      });

    if (user.passwordResetExpiresAt < new Date())
      throw BadRequestError('Reset token has expired', {
        errorCode: AuthErrorCode.RESET_TOKEN_EXPIRED,
        layer: ErrorLayer.APPLICATION,
      });

    const hashedPassword = await hashPassword(data.newPassword);
    let updated = user.updatePassword(hashedPassword);
    updated = updated.clearPasswordResetToken();
    updated = updated.incrementTokenVersion();
    await this.repo.update(user.id, updated);
  }
}
