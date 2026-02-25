import { LogoutCommand, LogoutHandler } from './logout.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { User } from '../../../user/domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';

describe('LogoutHandler', () => {
  let handler: LogoutHandler;
  let repo: jest.Mocked<IUserRepository>;

  const createUser = () =>
    User.load({
      id: '019450c4-5b12-7000-8000-000000000001',
      email: 'test@example.com',
      password: 'hashed',
      name: 'Test',
      lastLoginAt: null,
      refreshToken: 'hashed-refresh',
      refreshTokenExpiresAt: new Date(Date.now() + 86400000),
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      googleId: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn().mockResolvedValue(true),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    handler = new LogoutHandler(repo);
  });

  it('should clear refresh token on logout', async () => {
    repo.findById.mockResolvedValue(createUser());

    await handler.execute(new LogoutCommand('019450c4-5b12-7000-8000-000000000001'));

    expect(repo.update).toHaveBeenCalledWith(
      '019450c4-5b12-7000-8000-000000000001',
      expect.objectContaining({ refreshToken: null })
    );
  });

  it('should throw if user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new LogoutCommand('019450c4-5b12-7000-8000-000000000001'))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should reject invalid user ID', async () => {
    await expect(handler.execute(new LogoutCommand('bad-id'))).rejects.toBeInstanceOf(DomainError);
  });
});
