import { DomainError } from '@portfolio/shared/errors';
import { GetUserByIdQuery, GetUserByIdHandler } from './get-user-by-id.query';
import { IUserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';

describe('GetUserByIdHandler', () => {
  let handler: GetUserByIdHandler;
  let repo: jest.Mocked<IUserRepository>;

  const mockUser = User.create({
    email: 'test@example.com',
    password: 'hash',
    name: 'Test',
  });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };
    handler = new GetUserByIdHandler(repo);
  });

  it('should return public props when user accesses own profile', async () => {
    const query = new GetUserByIdQuery(mockUser.id, mockUser.id, 'USER');
    const result = await handler.execute(query);

    expect(result).toEqual({
      id: mockUser.id,
      email: 'test@example.com',
      name: 'Test',
      role: 'USER',
      hasPassword: true,
      hasGoogleLinked: false,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('refreshToken');
    expect(repo.findById).toHaveBeenCalledWith(mockUser.id);
  });

  it('should allow admin to access any user profile', async () => {
    const query = new GetUserByIdQuery(mockUser.id, 'different-admin-id', 'ADMIN');
    const result = await handler.execute(query);

    expect(result.id).toBe(mockUser.id);
  });

  it('should throw ForbiddenError when user accesses another user profile', async () => {
    const query = new GetUserByIdQuery(mockUser.id, 'different-user-id', 'USER');

    await expect(handler.execute(query)).rejects.toBeInstanceOf(DomainError);
    await expect(handler.execute(query)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('should throw DomainError for invalid UUID', async () => {
    const query = new GetUserByIdQuery('not-a-uuid', 'some-id', 'USER');

    await expect(handler.execute(query)).rejects.toBeInstanceOf(DomainError);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('should throw DomainError when user not found', async () => {
    repo.findById.mockResolvedValue(null);
    const query = new GetUserByIdQuery(mockUser.id, mockUser.id, 'USER');

    await expect(handler.execute(query)).rejects.toBeInstanceOf(DomainError);
  });
});
