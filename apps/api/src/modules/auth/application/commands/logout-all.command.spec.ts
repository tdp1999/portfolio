import { LogoutAllCommand, LogoutAllHandler } from './logout-all.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { User } from '../../../user/domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';

describe('LogoutAllHandler', () => {
  let handler: LogoutAllHandler;
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
      tokenVersion: 5,
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
    handler = new LogoutAllHandler(repo);
  });

  it('should increment token version and clear refresh token', async () => {
    repo.findById.mockResolvedValue(createUser());

    await handler.execute(new LogoutAllCommand('019450c4-5b12-7000-8000-000000000001'));

    expect(repo.update).toHaveBeenCalledWith(
      '019450c4-5b12-7000-8000-000000000001',
      expect.objectContaining({ tokenVersion: 6, refreshToken: null })
    );
  });

  it('should throw if user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new LogoutAllCommand('019450c4-5b12-7000-8000-000000000001'))
    ).rejects.toBeInstanceOf(DomainError);
  });
});
