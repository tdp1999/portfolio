import { ListUsersQuery, ListUsersHandler } from './list-users.query';
import { IUserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';

describe('ListUsersHandler', () => {
  let handler: ListUsersHandler;
  let repo: jest.Mocked<IUserRepository>;

  const createUser = (id: string, email: string) =>
    User.load({
      id,
      email,
      password: '$2a$10$hashedpassword',
      name: 'User',
      role: 'USER',
      lastLoginAt: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
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
    });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };

    handler = new ListUsersHandler(repo);
  });

  it('should return paginated user list', async () => {
    const users = [createUser('id-1', 'a@example.com'), createUser('id-2', 'b@example.com')];
    repo.findAll.mockResolvedValue({ data: users, total: 2 });

    const result = await handler.execute(new ListUsersQuery({ page: 1, limit: 20 }));

    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(repo.findAll).toHaveBeenCalledWith({ page: 1, limit: 20, search: undefined });
  });

  it('should pass search parameter', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 });

    await handler.execute(new ListUsersQuery({ page: 1, limit: 10, search: 'john' }));

    expect(repo.findAll).toHaveBeenCalledWith({ page: 1, limit: 10, search: 'john' });
  });

  it('should use defaults for missing params', async () => {
    repo.findAll.mockResolvedValue({ data: [], total: 0 });

    const result = await handler.execute(new ListUsersQuery({}));

    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it('should reject invalid pagination params', async () => {
    await expect(handler.execute(new ListUsersQuery({ page: -1 }))).rejects.toBeInstanceOf(DomainError);
  });

  it('should return public props only', async () => {
    const users = [createUser('id-1', 'a@example.com')];
    repo.findAll.mockResolvedValue({ data: users, total: 1 });

    const result = await handler.execute(new ListUsersQuery({}));

    expect(result.data[0]).toHaveProperty('id');
    expect(result.data[0]).toHaveProperty('email');
    expect(result.data[0]).not.toHaveProperty('password');
    expect(result.data[0]).not.toHaveProperty('refreshToken');
  });
});
