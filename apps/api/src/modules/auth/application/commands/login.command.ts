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

    if (user.isLocked())
      throw UnauthorizedError('Invalid credentials', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.ACCOUNT_LOCKED,
      });

    if (!user.password)
      throw UnauthorizedError('Invalid credentials', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_CREDENTIALS,
      });

    const passwordValid = await comparePassword(data.password, user.password);
    if (!passwordValid) {
      let updated = user.incrementFailedAttempts();
      if (updated.failedLoginAttempts >= 5) {
        const BACKOFF_MINUTES = [1, 5, 15, 30, 60];
        const lockIndex = Math.min(updated.failedLoginAttempts - 5, BACKOFF_MINUTES.length - 1);
        const lockUntil = new Date(Date.now() + BACKOFF_MINUTES[lockIndex] * 60 * 1000);
        updated = updated.lock(lockUntil);
      }
      await this.repo.update(user.id, updated);
      throw UnauthorizedError('Invalid credentials', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_CREDENTIALS,
      });
    }

    // Success: reset failed attempts, generate tokens, store refresh token
    const refreshToken = this.tokenService.generateRefreshToken();
    const hashedRefresh = await this.tokenService.hashRefreshToken(refreshToken);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    let updated = user.resetFailedAttempts();
    updated = updated.setRefreshToken(hashedRefresh, refreshExpiresAt);
    await this.repo.update(user.id, updated);

    const accessToken = this.tokenService.signAccessToken(user.id, user.tokenVersion);

    // Fire-and-forget: update last login
    this.commandBus.execute(new UpdateLastLoginCommand(user.id));

    return { accessToken, refreshToken, rememberMe: data.rememberMe };
  }
}
