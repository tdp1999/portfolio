import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { ValidationError, ConflictError, ErrorLayer, UserErrorCode } from '@portfolio/shared/errors';
import { IUserRepository } from '../ports/user.repository.port';
import { USER_REPOSITORY } from '../user.token';
import { EMAIL_SERVICE, IEmailService } from '../../../email';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { CreateUserByAdminSchema } from '../user.dto';
import { User } from '../../domain/entities/user.entity';

const FRONTEND_URL = process.env['FRONTEND_URL'] || 'http://localhost:4200';
const INVITE_EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 hours

export class InviteUserCommand extends BaseCommand {
  constructor(
    readonly dto: unknown,
    initiatorId: string
  ) {
    super(initiatorId);
  }
}

@CommandHandler(InviteUserCommand)
export class InviteUserHandler implements ICommandHandler<InviteUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: IUserRepository,
    @Inject(EMAIL_SERVICE) private readonly emailService: IEmailService
  ) {}

  async execute(command: InviteUserCommand) {
    const { success, data, error } = CreateUserByAdminSchema.safeParse(command.dto);
    if (!success)
      throw ValidationError(error, {
        errorCode: UserErrorCode.INVALID_INPUT,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Invite user validation failed',
      });

    const existing = await this.repo.findByEmailIncludingDeleted(data.email);

    if (existing && !existing.deletedAt)
      throw ConflictError('Email is already taken', {
        errorCode: UserErrorCode.EMAIL_TAKEN,
        layer: ErrorLayer.APPLICATION,
      });

    const rawToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_MS);

    let userId: string;
    let withToken: User;

    if (existing?.deletedAt) {
      // Restore soft-deleted user and re-invite
      const restored = existing
        .restore()
        .updateProfile({ name: data.name, role: data.role })
        .setInviteToken(hashedToken, expiresAt);
      withToken = restored;
      userId = existing.id;
      await this.repo.update(userId, restored.toUpdateData());
    } else {
      // Create new user
      const user = User.create({
        email: data.email,
        name: data.name,
        password: null,
        role: data.role,
      });
      withToken = user.setInviteToken(hashedToken, expiresAt);
      userId = await this.repo.add(withToken);
    }

    const inviteLink = `${FRONTEND_URL}/auth/set-password?token=${rawToken}&userId=${userId}`;
    await this.emailService.sendEmail({
      to: data.email,
      subject: 'You have been invited',
      html: `You have been invited to join. Click to set your password: <a href="${inviteLink}">${inviteLink}</a>. This link expires in 72 hours.`,
    });

    return withToken.toPublicProps();
  }
}
