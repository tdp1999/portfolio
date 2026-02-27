import { GoogleLoginCommand, GoogleLoginHandler, GoogleLoginResult } from './google-login.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { TokenService } from '../services/token.service';
import { CommandBus } from '@nestjs/cqrs';
import { User } from '../../../user/domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';

describe('GoogleLoginHandler', () => {
  let handler: GoogleLoginHandler;
  let repo: jest.Mocked<IUserRepository>;
  let tokenService: jest.Mocked<TokenService>;
  let commandBus: jest.Mocked<CommandBus>;

  const validProfile = {
    email: 'test@example.com',
    name: 'Test User',
    googleId: 'google-123',
  };

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) =>
    User.load({
      id: 'user-id-123',
      email: 'test@example.com',
      password: '$2a$10$hashedpassword',
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
      add: jest.fn().mockResolvedValue('new-user-id'),
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

    handler = new GoogleLoginHandler(repo, tokenService, commandBus);
  });

  it('should reject missing email', async () => {
    await expect(
      handler.execute(new GoogleLoginCommand({ ...validProfile, email: '' }))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should reject missing googleId', async () => {
    await expect(
      handler.execute(new GoogleLoginCommand({ ...validProfile, googleId: '' }))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should reject missing name', async () => {
    await expect(
      handler.execute(new GoogleLoginCommand({ ...validProfile, name: '' }))
    ).rejects.toBeInstanceOf(DomainError);
  });

  describe('when user with email exists', () => {
    it('should link googleId and issue tokens', async () => {
      const user = createUser();
      repo.findByEmail.mockResolvedValue(user);

      const result: GoogleLoginResult = await handler.execute(new GoogleLoginCommand(validProfile));

      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-jwt');
      expect(repo.update).toHaveBeenCalledWith('user-id-123', expect.objectContaining({}));
      // Should have linked google + set refresh token
      const updatedUser = repo.update.mock.calls[0][1] as User;
      expect(updatedUser.googleId).toBe('google-123');
      expect(updatedUser.refreshToken).toBe('refresh-token-jwt');
    });

    it('should not overwrite existing googleId if already linked', async () => {
      const user = createUser({ googleId: 'google-123' });
      repo.findByEmail.mockResolvedValue(user);

      const result = await handler.execute(new GoogleLoginCommand(validProfile));

      expect(result.accessToken).toBe('access-token-123');
      // Should still update refresh token but googleId stays the same
      const updatedUser = repo.update.mock.calls[0][1] as User;
      expect(updatedUser.googleId).toBe('google-123');
    });

    it('should reset failed attempts on google login', async () => {
      const user = createUser({ failedLoginAttempts: 3 });
      repo.findByEmail.mockResolvedValue(user);

      await handler.execute(new GoogleLoginCommand(validProfile));

      const updatedUser = repo.update.mock.calls[0][1] as User;
      expect(updatedUser.failedLoginAttempts).toBe(0);
    });

    it('should dispatch UpdateLastLoginCommand', async () => {
      const user = createUser();
      repo.findByEmail.mockResolvedValue(user);

      await handler.execute(new GoogleLoginCommand(validProfile));

      expect(commandBus.execute).toHaveBeenCalled();
    });
  });

  describe('when user does not exist', () => {
    it('should create new user without password and issue tokens', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.add.mockResolvedValue('new-user-id');

      const result: GoogleLoginResult = await handler.execute(new GoogleLoginCommand(validProfile));

      expect(result.accessToken).toBe('access-token-123');
      expect(result.refreshToken).toBe('refresh-token-jwt');
      expect(repo.add).toHaveBeenCalled();
    });

    it('should create user with googleId and no password', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.add.mockResolvedValue('new-user-id');

      await handler.execute(new GoogleLoginCommand(validProfile));

      const addedUser = repo.add.mock.calls[0][0] as User;
      expect(addedUser.email).toBe('test@example.com');
      expect(addedUser.name).toBe('Test User');
      expect(addedUser.googleId).toBe('google-123');
      expect(addedUser.password).toBeNull();
    });

    it('should dispatch UpdateLastLoginCommand for new user', async () => {
      repo.findByEmail.mockResolvedValue(null);
      repo.add.mockResolvedValue('new-user-id');

      await handler.execute(new GoogleLoginCommand(validProfile));

      expect(commandBus.execute).toHaveBeenCalled();
    });
  });

  describe('locked account', () => {
    it('should allow google login even if account is locked', async () => {
      const user = createUser({ lockedUntil: new Date(Date.now() + 60000) });
      repo.findByEmail.mockResolvedValue(user);

      const result = await handler.execute(new GoogleLoginCommand(validProfile));

      expect(result.accessToken).toBe('access-token-123');
      // Should also unlock the account
      const updatedUser = repo.update.mock.calls[0][1] as User;
      expect(updatedUser.failedLoginAttempts).toBe(0);
    });
  });
});
