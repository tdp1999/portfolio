import { SoftDeleteUserCommand, SoftDeleteUserHandler } from './soft-delete-user.command';
import { IUserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';

describe('SoftDeleteUserHandler', () => {
  let handler: SoftDeleteUserHandler;
  let repo: jest.Mocked<IUserRepository>;

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) =>
    User.load({
      id: 'user-id-123',
      email: 'john@example.com',
      password: '$2a$10$hashedpassword',
      name: 'John Doe',
      role: 'USER',
      lastLoginAt: null,
      refreshToken: 'some-refresh-token',
      refreshTokenExpiresAt: new Date(Date.now() + 86400000),
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      googleId: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: 0,
      deletedAt: null,
      inviteToken: null,
      inviteTokenExpiresAt: null,
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
      findAll: jest.fn(),
    };

    handler = new SoftDeleteUserHandler(repo);
  });

  it('should soft-delete user, clear refresh token, and increment token version', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    await handler.execute(new SoftDeleteUserCommand('user-id-123', 'admin-1'));

    expect(repo.update).toHaveBeenCalledWith(
      'user-id-123',
      expect.objectContaining({
        deletedAt: expect.any(Date),
        refreshToken: null,
        refreshTokenExpiresAt: null,
        tokenVersion: 1,
      })
    );
  });

  it('should throw NotFoundError if user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(handler.execute(new SoftDeleteUserCommand('non-existent', 'admin-1'))).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('should throw BadRequestError if user already deleted', async () => {
    const user = createUser({ deletedAt: new Date() });
    repo.findById.mockResolvedValue(user);

    await expect(handler.execute(new SoftDeleteUserCommand('user-id-123', 'admin-1'))).rejects.toMatchObject({
      statusCode: 400,
      message: 'User is already deleted',
    });
  });
});
