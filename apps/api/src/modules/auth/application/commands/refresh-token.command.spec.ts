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

  const STORED_REFRESH_TOKEN = 'stored-refresh-jwt';

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) =>
    User.load({
      id: 'user-id-123',
      email: 'test@example.com',
      password: '$2a$10$hashedpassword',
      name: 'Test User',
      lastLoginAt: null,
      refreshToken: STORED_REFRESH_TOKEN,
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
      verifyAccessToken: jest.fn(),
      signRefreshToken: jest.fn().mockReturnValue('new-refresh-jwt'),
      verifyRefreshToken: jest.fn().mockReturnValue({ sub: 'user-id-123', tokenVersion: 0 }),
    } as unknown as jest.Mocked<TokenService>;

    handler = new RefreshTokenHandler(repo, tokenService);
  });

  it('should reject when refresh token is missing', async () => {
    await expect(handler.execute(new RefreshTokenCommand(null))).rejects.toBeInstanceOf(
      DomainError
    );
  });

  it('should reject when refresh JWT verification fails', async () => {
    tokenService.verifyRefreshToken.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(handler.execute(new RefreshTokenCommand('bad-jwt'))).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
    });
  });

  it('should reject when user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new RefreshTokenCommand(STORED_REFRESH_TOKEN))
    ).rejects.toMatchObject({ errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN });
  });

  it('should reject when no refresh token stored in DB', async () => {
    const user = createUser({ refreshToken: null });
    repo.findById.mockResolvedValue(user);

    await expect(
      handler.execute(new RefreshTokenCommand(STORED_REFRESH_TOKEN))
    ).rejects.toMatchObject({ errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN });
  });

  it('should reject when refresh token does not match stored value', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    await expect(handler.execute(new RefreshTokenCommand('different-jwt'))).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN,
    });
  });

  it('should reject when token version does not match', async () => {
    const user = createUser({ tokenVersion: 5 });
    repo.findById.mockResolvedValue(user);
    tokenService.verifyRefreshToken.mockReturnValue({ sub: 'user-id-123', tokenVersion: 3 });

    await expect(
      handler.execute(new RefreshTokenCommand(STORED_REFRESH_TOKEN))
    ).rejects.toMatchObject({ errorCode: AuthErrorCode.TOKEN_VERSION_MISMATCH });
  });

  it('should return new tokens on valid refresh', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    const result: RefreshTokenResult = await handler.execute(
      new RefreshTokenCommand(STORED_REFRESH_TOKEN)
    );

    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-jwt');
  });

  it('should rotate refresh token in DB', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    await handler.execute(new RefreshTokenCommand(STORED_REFRESH_TOKEN));

    expect(tokenService.signRefreshToken).toHaveBeenCalledWith('user-id-123', 0);
    expect(repo.update).toHaveBeenCalledWith('user-id-123', expect.anything());
  });

  it('should sign access token with correct user id and token version', async () => {
    const user = createUser({ tokenVersion: 2 });
    repo.findById.mockResolvedValue(user);
    tokenService.verifyRefreshToken.mockReturnValue({ sub: 'user-id-123', tokenVersion: 2 });

    await handler.execute(new RefreshTokenCommand(STORED_REFRESH_TOKEN));

    expect(tokenService.signAccessToken).toHaveBeenCalledWith('user-id-123', 2);
  });

  it('should accept old refresh token within grace period', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    // First refresh succeeds normally
    await handler.execute(new RefreshTokenCommand(STORED_REFRESH_TOKEN));

    // After rotation, the stored token in DB is now 'new-refresh-jwt'
    // Update user mock to reflect rotated state
    const rotatedUser = createUser({ refreshToken: 'new-refresh-jwt' });
    repo.findById.mockResolvedValue(rotatedUser);

    // Verify the OLD token — verifyRefreshToken still works on it
    tokenService.verifyRefreshToken.mockReturnValue({ sub: 'user-id-123', tokenVersion: 0 });

    // Second refresh with the OLD token — grace period should accept it
    const result = await handler.execute(new RefreshTokenCommand(STORED_REFRESH_TOKEN));

    expect(result.accessToken).toBe('new-access-token');
  });

  it('should reject old refresh token after grace period expires', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    // First refresh — sets grace period
    await handler.execute(new RefreshTokenCommand(STORED_REFRESH_TOKEN));

    // Simulate grace period expiry
    jest.useFakeTimers();
    jest.advanceTimersByTime(11_000);

    const rotatedUser = createUser({ refreshToken: 'new-refresh-jwt' });
    repo.findById.mockResolvedValue(rotatedUser);

    await expect(
      handler.execute(new RefreshTokenCommand(STORED_REFRESH_TOKEN))
    ).rejects.toMatchObject({ errorCode: AuthErrorCode.INVALID_REFRESH_TOKEN });

    jest.useRealTimers();
  });
});
