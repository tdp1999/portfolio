import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UnauthorizedError, ErrorLayer } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { TokenService } from '../services/token.service';
import { AuthErrorCode } from '../auth-error-code';

const GRACE_PERIOD_MS = 10_000;

type GraceEntry = { hash: string; expiresAt: number };

export type RefreshTokenResult = {
  accessToken: string;
  refreshToken: string;
};

export class RefreshTokenCommand extends BaseCommand {
  constructor(
    readonly refreshToken: string | null,
    readonly accessToken: string | null
  ) {
    super('anonymous');
  }
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler
  implements ICommandHandler<RefreshTokenCommand, RefreshTokenResult>
{
  // In-memory grace period for token rotation race conditions.
  // Note: not cluster-safe — use Redis with TTL for multi-instance deployments.
  private readonly graceTokens = new Map<string, GraceEntry>();

  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: IUserRepository,
    private readonly tokenService: TokenService
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    if (!command.refreshToken || !command.accessToken) {
      throw UnauthorizedError('Missing tokens', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
      });
    }

    // Decode access token (ignore expiration — it's expected to be expired)
    const payload = this.tokenService.verifyAccessToken(command.accessToken, {
      ignoreExpiration: true,
    });
    const userId = payload.sub;

    const user = await this.repo.findById(userId);
    if (!user || !user.refreshToken || !user.refreshTokenExpiresAt) {
      throw UnauthorizedError('Invalid refresh token', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
      });
    }

    // Check refresh token expiry
    if (user.refreshTokenExpiresAt < new Date()) {
      throw UnauthorizedError('Refresh token expired', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
      });
    }

    // Compare refresh token against stored hash
    const isValid = await this.tokenService.compareRefreshToken(
      command.refreshToken,
      user.refreshToken
    );
    if (!isValid) {
      // Check grace period: accept the previous token for 10s after rotation
      const grace = this.graceTokens.get(userId);
      const graceValid =
        grace &&
        grace.expiresAt > Date.now() &&
        (await this.tokenService.compareRefreshToken(command.refreshToken, grace.hash));
      if (!graceValid) {
        throw UnauthorizedError('Invalid refresh token', {
          layer: ErrorLayer.APPLICATION,
          errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
        });
      }
    }

    // Check token version
    if (payload.tokenVersion !== user.tokenVersion) {
      throw UnauthorizedError('Token version mismatch', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.TOKEN_VERSION_MISMATCH,
      });
    }

    // Rotate: generate new refresh token, store old hash in grace period
    const oldHash = user.refreshToken;
    const newRefreshToken = this.tokenService.generateRefreshToken();
    const hashedRefresh = await this.tokenService.hashRefreshToken(newRefreshToken);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updated = user.setRefreshToken(hashedRefresh, refreshExpiresAt);
    await this.repo.update(user.id, updated);

    // Grace period: allow old token for 10 seconds
    this.graceTokens.set(userId, { hash: oldHash, expiresAt: Date.now() + GRACE_PERIOD_MS });
    setTimeout(() => this.graceTokens.delete(userId), GRACE_PERIOD_MS);

    // Sign new access token
    const accessToken = this.tokenService.signAccessToken(user.id, user.tokenVersion);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
