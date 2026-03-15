import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { NotFoundError, ConflictError, ErrorLayer, UserErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';
import { EMAIL_SERVICE, IEmailService } from '../../../email';

const FRONTEND_URL = process.env['FRONTEND_URL'] || 'http://localhost:4200';
const INVITE_EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours

export class ResendInviteCommand extends BaseCommand {
  constructor(
    readonly targetUserId: string,
    initiatorId: string
  ) {
    super(initiatorId);
  }
}

@CommandHandler(ResendInviteCommand)
export class ResendInviteHandler implements ICommandHandler<ResendInviteCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: IUserRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService
  ) {}

  async execute(command: ResendInviteCommand): Promise<void> {
    const user = await this.repo.findById(command.targetUserId);
    if (!user)
      throw NotFoundError('User not found', {
        errorCode: UserErrorCode.NOT_FOUND,
        layer: ErrorLayer.APPLICATION,
      });

    if (user.password)
      throw ConflictError('User has already activated their account.', {
        errorCode: UserErrorCode.ALREADY_ACTIVATED,
        layer: ErrorLayer.APPLICATION,
      });

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);
    const updated = user.setInviteToken(hashedToken, expiresAt);
    await this.repo.update(user.id, updated.toUpdateData());

    const inviteLink = `${FRONTEND_URL}/auth/set-password?token=${rawToken}&userId=${user.id}`;
    await this.emailService.sendEmail({
      to: user.email,
      subject: 'You have been invited (reminder)',
      html: `You have been invited to join. Click to set your password: <a href="${inviteLink}">${inviteLink}</a>. This link expires in 72 hours.`,
    });
  }
}
