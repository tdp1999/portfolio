import { LoginCommand, LoginHandler, LoginResult } from './login.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { TokenService } from '../services/token.service';
import { CommandBus } from '@nestjs/cqrs';
import { User } from '../../../user/domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';
import { AuthErrorCode } from '@portfolio/shared/errors';
import * as hashUtil from '@portfolio/shared/utils';

describe('LoginHandler', () => {
  let handler: LoginHandler;
  let repo: jest.Mocked<IUserRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let commandBus: jest.Mocked<CommandBus>;

  const validDto = { email: 'test@example.com', password: 'Password1!', rememberMe: false };
  const hashedPassword = '$2a$10$hashedpassword';

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) =>
    User.load({
      id: 'user-id-123',
      email: 'test@example.com',
      password: hashedPassword,
      name: 'Test User',
      lastLoginAt: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
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
      signAccessToken: jest.fn().mockReturnValue('access-token-123'),
      signRefreshToken: jest.fn().mockReturnValue('refresh-token-jwt'),
      verifyAccessToken: jest.fn(),
      verifyRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<TokenService>;
    commandBus = { execute: jest.fn() } as unknown as jest.Mocked<CommandBus>;

    handler = new LoginHandler(repo, tokenService, commandBus);
  });

  it('should reject invalid input', async () => {
    await expect(handler.execute(new LoginCommand({ email: 'bad' }))).rejects.toBeInstanceOf(DomainError);
  });

  it('should return generic error for non-existent email', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await expect(handler.execute(new LoginCommand(validDto))).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_CREDENTIALS,
    });
  });

  it('should return structured error for locked account with retryAfterSeconds', async () => {
    const lockedUser = createUser({ lockedUntil: new Date(Date.now() + 60000) });
    repo.findByEmail.mockResolvedValue(lockedUser);

    await expect(handler.execute(new LoginCommand(validDto))).rejects.toMatchObject({
      errorCode: AuthErrorCode.ACCOUNT_LOCKED,
    });

    try {
      await handler.execute(new LoginCommand(validDto));
    } catch (e: unknown) {
      const err = e as { data: unknown };
      const data = err.data as { remainingAttempts: number; retryAfterSeconds: number };
      expect(data.remainingAttempts).toBe(0);
      expect(data.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it('should return structured error with remainingAttempts for wrong password', async () => {
    const user = createUser();
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

    await expect(handler.execute(new LoginCommand(validDto))).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_CREDENTIALS,
    });

    try {
      repo.findByEmail.mockResolvedValue(createUser());
      jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);
      await handler.execute(new LoginCommand(validDto));
    } catch (e: unknown) {
      const err = e as { data: unknown };
      const data = err.data as { remainingAttempts: number };
      expect(data.remainingAttempts).toBe(4);
    }
  });

  it('should increment failed attempts on wrong password', async () => {
    const user = createUser();
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

    await expect(handler.execute(new LoginCommand(validDto))).rejects.toBeDefined();
    expect(repo.update).toHaveBeenCalledWith('user-id-123', expect.anything());
  });

  it('should return tokens on successful login', async () => {
    const user = createUser();
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);

    const result: LoginResult = await handler.execute(new LoginCommand(validDto));

    expect(result.accessToken).toBe('access-token-123');
    expect(result.refreshToken).toBe('refresh-token-jwt');
    expect(result.rememberMe).toBe(false);
    expect(tokenService.signAccessToken).toHaveBeenCalledWith('user-id-123', 0);
    expect(tokenService.signRefreshToken).toHaveBeenCalledWith('user-id-123', 0);
  });

  it('should reset failed attempts on successful login', async () => {
    const user = createUser({ failedLoginAttempts: 3 });
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);

    await handler.execute(new LoginCommand(validDto));

    expect(repo.update).toHaveBeenCalled();
  });

  it('should dispatch UpdateLastLoginCommand on success', async () => {
    const user = createUser();
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);

    await handler.execute(new LoginCommand(validDto));

    expect(commandBus.execute).toHaveBeenCalled();
  });

  it('should pass rememberMe flag through', async () => {
    const user = createUser();
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);

    const result = await handler.execute(new LoginCommand({ ...validDto, rememberMe: true }));

    expect(result.rememberMe).toBe(true);
  });

  it('should lock account after 5th failed attempt with 1 minute backoff', async () => {
    const user = createUser({ failedLoginAttempts: 4 }); // will become 5
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

    try {
      await handler.execute(new LoginCommand(validDto));
    } catch (e: unknown) {
      const err = e as { data: unknown; errorCode: string };
      expect(err.errorCode).toBe(AuthErrorCode.ACCOUNT_LOCKED);
      const data = err.data as { remainingAttempts: number; retryAfterSeconds: number };
      expect(data.remainingAttempts).toBe(0);
      expect(data.retryAfterSeconds).toBe(60);
    }

    const updateCall = repo.update.mock.calls[0];
    const updatedUser = updateCall[1] as User;
    expect(updatedUser.failedLoginAttempts).toBe(5);
    expect(updatedUser.lockedUntil).not.toBeNull();
    const expectedLock = Date.now() + 1 * 60 * 1000;
    expect(updatedUser.lockedUntil!.getTime()).toBeCloseTo(expectedLock, -3);
  });

  it('should apply exponential backoff: 5min on 6th failure', async () => {
    const user = createUser({ failedLoginAttempts: 5 });
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

    await expect(handler.execute(new LoginCommand(validDto))).rejects.toBeDefined();

    const updatedUser = repo.update.mock.calls[0][1] as User;
    expect(updatedUser.failedLoginAttempts).toBe(6);
    const expectedLock = Date.now() + 5 * 60 * 1000;
    expect(updatedUser.lockedUntil!.getTime()).toBeCloseTo(expectedLock, -3);
  });

  it('should apply exponential backoff: 15min on 7th failure', async () => {
    const user = createUser({ failedLoginAttempts: 6 });
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

    await expect(handler.execute(new LoginCommand(validDto))).rejects.toBeDefined();

    const updatedUser = repo.update.mock.calls[0][1] as User;
    const expectedLock = Date.now() + 15 * 60 * 1000;
    expect(updatedUser.lockedUntil!.getTime()).toBeCloseTo(expectedLock, -3);
  });

  it('should cap backoff at 60 minutes', async () => {
    const user = createUser({ failedLoginAttempts: 20 }); // way past cap
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

    await expect(handler.execute(new LoginCommand(validDto))).rejects.toBeDefined();

    const updatedUser = repo.update.mock.calls[0][1] as User;
    const expectedLock = Date.now() + 60 * 60 * 1000;
    expect(updatedUser.lockedUntil!.getTime()).toBeCloseTo(expectedLock, -3);
  });

  it('should not lock account before 5th failed attempt', async () => {
    const user = createUser({ failedLoginAttempts: 3 }); // will become 4
    repo.findByEmail.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

    await expect(handler.execute(new LoginCommand(validDto))).rejects.toBeDefined();

    const updatedUser = repo.update.mock.calls[0][1] as User;
    expect(updatedUser.failedLoginAttempts).toBe(4);
    expect(updatedUser.lockedUntil).toBeNull();
  });

  it('should reject login when user has no password (OAuth-only)', async () => {
    const user = createUser({ password: null });
    repo.findByEmail.mockResolvedValue(user);

    await expect(handler.execute(new LoginCommand(validDto))).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_CREDENTIALS,
    });
  });
});
