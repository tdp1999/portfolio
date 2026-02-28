import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ValidationError, ErrorLayer, AuthErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { TokenService } from '../services/token.service';
import { User } from '../../../user/domain/entities/user.entity';
import { UpdateLastLoginCommand } from '../../../user/application/commands/update-last-login.command';
import { GoogleCallbackSchema } from '../auth.dto';

export type GoogleLoginResult = {
  accessToken: string;
  refreshToken: string;
};

export class GoogleLoginCommand extends BaseCommand {
  constructor(readonly profile: unknown) {
    super('anonymous');
  }
}

@CommandHandler(GoogleLoginCommand)
export class GoogleLoginHandler implements ICommandHandler<GoogleLoginCommand, GoogleLoginResult> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: IUserRepository,
    private readonly tokenService: TokenService,
    private readonly commandBus: CommandBus
  ) {}

  async execute(command: GoogleLoginCommand): Promise<GoogleLoginResult> {
    const { success, data, error } = GoogleCallbackSchema.safeParse(command.profile);
    if (!success)
      throw ValidationError(error, {
        errorCode: AuthErrorCode.GOOGLE_AUTH_FAILED,
        layer: ErrorLayer.APPLICATION,
        remarks: 'Google login validation failed',
      });

    let user = await this.repo.findByEmail(data.email);

    if (user) {
      // Existing user: link google if not linked, reset failed attempts
      let updated = user.resetFailedAttempts();
      if (!user.googleId) {
        updated = updated.linkGoogle(data.googleId);
      }
      const refreshToken = this.tokenService.signRefreshToken(user.id, user.tokenVersion);
      const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      updated = updated.setRefreshToken(refreshToken, refreshExpiresAt);
      await this.repo.update(user.id, updated);

      const accessToken = this.tokenService.signAccessToken(user.id, user.tokenVersion);
      this.commandBus.execute(new UpdateLastLoginCommand(user.id));

      return { accessToken, refreshToken };
    }

    // New user: create without password
    const newUser = User.create({
      email: data.email,
      name: data.name,
      password: null,
      googleId: data.googleId,
    });

    const refreshToken = this.tokenService.signRefreshToken(newUser.id, 0);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const withRefresh = newUser.setRefreshToken(refreshToken, refreshExpiresAt);

    const userId = await this.repo.add(withRefresh);
    const accessToken = this.tokenService.signAccessToken(userId, 0);
    this.commandBus.execute(new UpdateLastLoginCommand(userId));

    return { accessToken, refreshToken };
  }
}
