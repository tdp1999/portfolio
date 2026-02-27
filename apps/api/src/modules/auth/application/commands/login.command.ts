import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BadRequestError, UnauthorizedError, ErrorLayer } from '@portfolio/shared/errors';
import { comparePassword } from '@portfolio/shared/utils';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { TokenService } from '../services/token.service';
import { LoginSchema } from '../auth.dto';
import { AuthErrorCode } from '../auth-error-code';
import { UpdateLastLoginCommand } from '../../../user/application/commands/update-last-login.command';

export type LoginResult = {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
};

export class LoginCommand extends BaseCommand {
  constructor(readonly dto: unknown) {
    super('anonymous');
  }
}

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginResult> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    const { success, data, error } = LoginSchema.safeParse(command.dto);
    if (!success)
      throw BadRequestError(error, {
        layer: ErrorLayer.APPLICATION,
        remarks: 'Login validation failed',
      });

    const user = await this.repo.findByEmail(data.email);
    if (!user)
      throw UnauthorizedError('Invalid credentials', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_CREDENTIALS,
      });

    if (user.isLocked()) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((user.lockedUntil!.getTime() - Date.now()) / 1000)
      );
      throw UnauthorizedError(
        { error: 'Invalid credentials', remainingAttempts: 0, retryAfterSeconds },
        {
          layer: ErrorLayer.APPLICATION,
          errorCode: AuthErrorCode.ACCOUNT_LOCKED,
        }
      );
    }

    if (!user.password)
      throw UnauthorizedError('Invalid credentials', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_CREDENTIALS,
      });

    const passwordValid = await comparePassword(data.password, user.password);
    if (!passwordValid) {
      let updated = user.incrementFailedAttempts();
      const MAX_ATTEMPTS = 5;
      if (updated.failedLoginAttempts >= MAX_ATTEMPTS) {
        const BACKOFF_MINUTES = [1, 5, 15, 30, 60];
        const lockIndex = Math.min(
          updated.failedLoginAttempts - MAX_ATTEMPTS,
          BACKOFF_MINUTES.length - 1
        );
        const lockUntil = new Date(Date.now() + BACKOFF_MINUTES[lockIndex] * 60 * 1000);
        updated = updated.lock(lockUntil);
        await this.repo.update(user.id, updated);
        const retryAfterSeconds = Math.ceil(BACKOFF_MINUTES[lockIndex] * 60);
        throw UnauthorizedError(
          { error: 'Invalid credentials', remainingAttempts: 0, retryAfterSeconds },
          {
            layer: ErrorLayer.APPLICATION,
            errorCode: AuthErrorCode.ACCOUNT_LOCKED,
          }
        );
      }
      await this.repo.update(user.id, updated);
      throw UnauthorizedError(
        {
          error: 'Invalid credentials',
          remainingAttempts: MAX_ATTEMPTS - updated.failedLoginAttempts,
        },
        {
          layer: ErrorLayer.APPLICATION,
          errorCode: AuthErrorCode.INVALID_CREDENTIALS,
        }
      );
    }

    // Success: reset failed attempts, generate tokens, store refresh token
    const refreshToken = this.tokenService.signRefreshToken(user.id, user.tokenVersion);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let updated = user.resetFailedAttempts();
    updated = updated.setRefreshToken(refreshToken, refreshExpiresAt);
    await this.repo.update(user.id, updated);

    const accessToken = this.tokenService.signAccessToken(user.id, user.tokenVersion);

    // Fire-and-forget: update last login
    this.commandBus.execute(new UpdateLastLoginCommand(user.id));

    return { accessToken, refreshToken, rememberMe: data.rememberMe };
  }
}
