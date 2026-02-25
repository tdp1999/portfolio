import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { BadRequestError, ErrorLayer } from '@portfolio/shared/errors';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { EMAIL_SERVICE, IEmailService } from '../../../email';
import { ForgotPasswordSchema } from '../auth.dto';

const FRONTEND_URL = process.env['FRONTEND_URL'] || 'http://localhost:4200';

export class ForgotPasswordCommand {
  constructor(readonly dto: unknown) {}
}

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand, void> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: IUserRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<void> {
    const { success, data, error } = ForgotPasswordSchema.safeParse(command.dto);
    if (!success)
      throw BadRequestError(error, {
        layer: ErrorLayer.APPLICATION,
        remarks: 'Forgot password validation failed',
      });

    const user = await this.repo.findByEmail(data.email);
    if (!user) return;

    // Skip Google-only users (no password set)
    if (!user.password) return;

    // Generate token, hash it, store hash + expiry
    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const updated = user.setPasswordResetToken(hashedToken, expiresAt);
    await this.repo.update(user.id, updated);

    const resetLink = `${FRONTEND_URL}/auth/reset-password?token=${rawToken}&id=${user.id}`;
    await this.emailService.sendEmail({
      to: user.email,
      subject: 'Password Reset',
      html: `Click to reset your password: <a href="${resetLink}">${resetLink}</a>. This link expires in 1 hour.`,
    });
  }
}
