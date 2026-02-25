import {
  RefreshTokenCommand,
  RefreshTokenHandler,
  RefreshTokenResult,
} from './refresh-token.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { TokenService } from '../services/token.service';
import { User } from '../../../user/domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';
import { AuthErrorCode } from '../auth-error-code';

describe('RefreshTokenHandler', () => {
  let handler: RefreshTokenHandler;
  let repo: jest.Mocked<IUserRepository>;
  let tokenService: jest.Mocked<TokenService>;

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) =>
    User.load({
      id: 'user-id-123',
      email: 'test@example.com',
      password: '$2a$10$hashedpassword',
      name: 'Test User',
      lastLoginAt: null,
      refreshToken: 'hashed-refresh-in-db',
      refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      googleId: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: 0,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn().mockResolvedValue(true),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    tokenService = {
      signAccessToken: jest.fn().mockReturnValue('new-access-token'),
      generateRefreshToken: jest.fn().mockReturnValue('new-refresh-token-hex'),
      hashRefreshToken: jest.fn().mockResolvedValue('new-hashed-refresh'),
      verifyAccessToken: jest.fn().mockReturnValue({ sub: 'user-id-123', tokenVersion: 0 }),
      compareRefreshToken: jest.fn().mockResolvedValue(true),
    } as unknown as jest.Mocked<TokenService>;

    handler = new RefreshTokenHandler(repo, tokenService);
  });

  it('should reject when refresh token is missing', async () => {
    await expect(
      handler.execute(new RefreshTokenCommand(null, 'valid-access'))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should reject when access token is missing', async () => {
    await expect(
      handler.execute(new RefreshTokenCommand('refresh-token', null))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should reject when user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new RefreshTokenCommand('refresh-token', 'valid-access'))
    ).rejects.toMatchObject({ errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN });
  });

  it('should reject when no refresh token stored in DB', async () => {
    const user = createUser({ refreshToken: null, refreshTokenExpiresAt: null });
    repo.findById.mockResolvedValue(user);

    await expect(
      handler.execute(new RefreshTokenCommand('refresh-token', 'valid-access'))
    ).rejects.toMatchObject({ errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN });
  });

  it('should reject when refresh token is expired', async () => {
    const user = createUser({ refreshTokenExpiresAt: new Date(Date.now() - 1000) });
    repo.findById.mockResolvedValue(user);

    await expect(
      handler.execute(new RefreshTokenCommand('refresh-token', 'valid-access'))
    ).rejects.toMatchObject({ errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN });
  });

  it('should reject when refresh token does not match hash', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);
    tokenService.compareRefreshToken.mockResolvedValue(false);

    await expect(
      handler.execute(new RefreshTokenCommand('wrong-refresh-token', 'valid-access'))
    ).rejects.toMatchObject({ errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN });
  });

  it('should reject when token version does not match', async () => {
    const user = createUser({ tokenVersion: 5 });
    repo.findById.mockResolvedValue(user);
    tokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-id-123',
      tokenVersion: 3,
      iat: 0,
      exp: 0,
    });

    await expect(
      handler.execute(new RefreshTokenCommand('refresh-token', 'valid-access'))
    ).rejects.toMatchObject({ errorCode: AuthErrorCode.TOKEN_VERSION_MISMATCH });
  });

  it('should return new tokens on valid refresh', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    const result: RefreshTokenResult = await handler.execute(
      new RefreshTokenCommand('refresh-token', 'valid-access')
    );

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token-hex');
  });

  it('should rotate refresh token in DB', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    await handler.execute(new RefreshTokenCommand('refresh-token', 'valid-access'));

    expect(tokenService.generateRefreshToken).toHaveBeenCalled();
    expect(tokenService.hashRefreshToken).toHaveBeenCalledWith('new-refresh-token-hex');
    expect(repo.update).toHaveBeenCalledWith('user-id-123', expect.anything());
  });

  it('should sign access token with correct user id and token version', async () => {
    const user = createUser({ tokenVersion: 2 });
    repo.findById.mockResolvedValue(user);
    tokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-id-123',
      tokenVersion: 2,
      iat: 0,
      exp: 0,
    });

    await handler.execute(new RefreshTokenCommand('refresh-token', 'valid-access'));

    expect(tokenService.signAccessToken).toHaveBeenCalledWith('user-id-123', 2);
  });

  it('should accept old refresh token within grace period', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    // First refresh succeeds normally
    await handler.execute(new RefreshTokenCommand('refresh-token', 'valid-access'));

    // Second refresh with the OLD token — current hash won't match, but grace period should
    tokenService.compareRefreshToken
      .mockResolvedValueOnce(false) // current hash doesn't match
      .mockResolvedValueOnce(true); // grace hash matches

    const result = await handler.execute(new RefreshTokenCommand('refresh-token', 'valid-access'));

    expect(result.accessToken).toBe('new-access-token');
  });

  it('should reject old refresh token after grace period expires', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    // First refresh — sets grace period
    await handler.execute(new RefreshTokenCommand('refresh-token', 'valid-access'));

    // Simulate grace period expiry by advancing time
    jest.useFakeTimers();
    jest.advanceTimersByTime(11_000);

    // Current hash doesn't match, grace entry expired
    tokenService.compareRefreshToken.mockResolvedValue(false);

    await expect(
      handler.execute(new RefreshTokenCommand('old-refresh-token', 'valid-access'))
    ).rejects.toMatchObject({ errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN });

    jest.useRealTimers();
  });

  it('should still work when access token is expired (ignoreExpiration)', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);
    // verifyAccessToken called with ignoreExpiration should still return payload
    tokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-id-123',
      tokenVersion: 0,
      iat: 0,
      exp: 0,
    });

    const result = await handler.execute(
      new RefreshTokenCommand('refresh-token', 'expired-access')
    );

    expect(result.accessToken).toBe('new-access-token');
  });
});
