import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'crypto';
import { ValidationError, BadRequestError, ErrorLayer, AuthErrorCode } from '@portfolio/shared/errors';
import { hashPassword } from '@portfolio/shared/utils';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { SetPasswordSchema } from '../auth.dto';

export class SetPasswordCommand {
  constructor(readonly dto: unknown) {}
}

@CommandHandler(SetPasswordCommand)
export class SetPasswordHandler implements ICommandHandler<SetPasswordCommand, void> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: IUserRepository) {}

  async execute(command: SetPasswordCommand): Promise<void> {
    const { success, data, error } = SetPasswordSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: AuthErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Set password validation failed',
      });

    const user = await this.repo.findById(data.userId);
    if (!user || !user.inviteToken || !user.inviteTokenExpiresAt)
      throw BadRequestError('Invalid or expired invite token', {
        errorCode: AuthErrorCode.INVALID_INVITE_TOKEN,
        layer: ErrorLayer.APPLICATION,
      });

    // Timing-safe comparison of hashed tokens
    const hashedToken = createHash('sha256').update(data.token).digest('hex');
    const storedBuffer = Buffer.from(user.inviteToken, 'hex');
    const providedBuffer = Buffer.from(hashedToken, 'hex');
    if (storedBuffer.length !== providedBuffer.length || !timingSafeEqual(storedBuffer, providedBuffer))
      throw BadRequestError('Invalid or expired invite token', {
        errorCode: AuthErrorCode.INVALID_INVITE_TOKEN,
        layer: ErrorLayer.APPLICATION,
      });

    if (user.inviteTokenExpiresAt < new Date())
      throw BadRequestError('Invite token has expired', {
        errorCode: AuthErrorCode.INVITE_TOKEN_EXPIRED,
        layer: ErrorLayer.APPLICATION,
      });

    const hashedPassword = await hashPassword(data.newPassword);
    let updated = user.updatePassword(hashedPassword);
    updated = updated.clearInviteToken();
    await this.repo.update(user.id, updated.toUpdateData());
  }
}
