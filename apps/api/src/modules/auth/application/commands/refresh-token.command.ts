import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { UnauthorizedError, ErrorLayer, AuthErrorCode } from '@portfolio/shared/errors';
import { BaseCommand } from '../../../../shared/cqrs/base.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { USER_REPOSITORY } from '../../../user/application/user.token';
import { TokenService } from '../services/token.service';

const GRACE_PERIOD_MS = 10_000;

type GraceEntry = { token: string; expiresAt: number };

export type RefreshTokenResult = {
  accessToken: string;
  refreshToken: string;
};

export class RefreshTokenCommand extends BaseCommand {
  constructor(readonly refreshToken: string | null) {
    super('anonymous');
  }
}

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand, RefreshTokenResult> {
  // In-memory grace period for token rotation race conditions.
  // Note: not cluster-safe — use Redis with TTL for multi-instance deployments.
  private readonly graceTokens = new Map<string, GraceEntry>();

  constructor(
    @Inject(USER_REPOSITORY) private readonly repo: IUserRepository,
    private readonly tokenService: TokenService
  ) {}

  async execute(command: RefreshTokenCommand): Promise<RefreshTokenResult> {
    if (!command.refreshToken) {
      throw UnauthorizedError('Missing refresh token', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
      });
    }

    // Verify refresh JWT — extract userId and tokenVersion
    let userId: string;
    let tokenVersion: number;

    try {
      const payload = this.tokenService.verifyRefreshToken(command.refreshToken);
      userId = payload.sub;
      tokenVersion = payload.tokenVersion;
    } catch {
      throw UnauthorizedError('Invalid refresh token', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
      });
    }

    const user = await this.repo.findById(userId);
    if (!user || !user.refreshToken) {
      throw UnauthorizedError('Invalid refresh token', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
      });
    }

    // Compare refresh token against stored value (simple string equality)
    const isValid = command.refreshToken === user.refreshToken;
    if (!isValid) {
      // Check grace period: accept the previous token for 10s after rotation
      const grace = this.graceTokens.get(userId);
      const graceValid = grace && grace.expiresAt > Date.now() && command.refreshToken === grace.token;
      if (!graceValid) {
        throw UnauthorizedError('Invalid refresh token', {
          layer: ErrorLayer.APPLICATION,
          errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
        });
      }
    }

    // Check token version
    if (tokenVersion !== user.tokenVersion) {
      throw UnauthorizedError('Token version mismatch', {
        layer: ErrorLayer.APPLICATION,
        errorCode: AuthErrorCode.TOKEN_VERSION_MISMATCH,
      });
    }

    // Rotate: generate new refresh token, store old in grace period
    const oldToken = user.refreshToken;
    const newRefreshToken = this.tokenService.signRefreshToken(userId, user.tokenVersion);
    const refreshExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updated = user.setRefreshToken(newRefreshToken, refreshExpiresAt);
    await this.repo.update(user.id, updated);

    // Grace period: allow old token for 10 seconds
    this.graceTokens.set(userId, { token: oldToken, expiresAt: Date.now() + GRACE_PERIOD_MS });
    setTimeout(() => this.graceTokens.delete(userId), GRACE_PERIOD_MS);

    // Sign new access token
    const accessToken = this.tokenService.signAccessToken(user.id, user.tokenVersion);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
