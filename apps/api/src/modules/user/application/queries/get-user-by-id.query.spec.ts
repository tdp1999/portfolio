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
    };
    handler = new GetUserByIdHandler(repo);
  });

  it('should return public props only', async () => {
    const query = new GetUserByIdQuery(mockUser.id);
    const result = await handler.execute(query);

    expect(result).toEqual({
      id: mockUser.id,
      email: 'test@example.com',
      name: 'Test',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(result).not.toHaveProperty('password');
    expect(result).not.toHaveProperty('refreshToken');
    expect(repo.findById).toHaveBeenCalledWith(mockUser.id);
  });

  it('should throw DomainError for invalid UUID', async () => {
    const query = new GetUserByIdQuery('not-a-uuid');

    await expect(handler.execute(query)).rejects.toBeInstanceOf(DomainError);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('should throw DomainError when user not found', async () => {
    repo.findById.mockResolvedValue(null);
    const query = new GetUserByIdQuery(mockUser.id);

    await expect(handler.execute(query)).rejects.toBeInstanceOf(DomainError);
  });
});
