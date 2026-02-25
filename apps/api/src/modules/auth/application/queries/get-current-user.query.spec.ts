import { GetCurrentUserQuery, GetCurrentUserHandler } from './get-current-user.query';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { User } from '../../../user/domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';

describe('GetCurrentUserHandler', () => {
  let handler: GetCurrentUserHandler;
  let repo: jest.Mocked<IUserRepository>;

  const createUser = () =>
    User.load({
      id: '019450c4-5b12-7000-8000-000000000001',
      email: 'test@example.com',
      password: 'hashed',
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
    });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    handler = new GetCurrentUserHandler(repo);
  });

  it('should return public user props', async () => {
    repo.findById.mockResolvedValue(createUser());

    const result = await handler.execute(
      new GetCurrentUserQuery('019450c4-5b12-7000-8000-000000000001')
    );

    expect(result).toEqual({
      id: '019450c4-5b12-7000-8000-000000000001',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
  });

  it('should throw if user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new GetCurrentUserQuery('019450c4-5b12-7000-8000-000000000001'))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should reject invalid user ID', async () => {
    await expect(handler.execute(new GetCurrentUserQuery('bad-id'))).rejects.toBeInstanceOf(
      DomainError
    );
  });
});
