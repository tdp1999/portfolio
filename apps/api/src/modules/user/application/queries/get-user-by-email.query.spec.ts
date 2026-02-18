import { DomainError } from '@portfolio/shared/errors';
import { GetUserByEmailQuery, GetUserByEmailHandler } from './get-user-by-email.query';
import { IUserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';

describe('GetUserByEmailHandler', () => {
  let handler: GetUserByEmailHandler;
  let repo: jest.Mocked<IUserRepository>;

  const mockUser = User.create({
    email: 'test@example.com',
    passwordHash: 'hash',
    name: 'Test',
  });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(mockUser),
    };
    handler = new GetUserByEmailHandler(repo);
  });

  it('should return public props only', async () => {
    const query = new GetUserByEmailQuery('test@example.com');
    const result = await handler.execute(query);

    expect(result).toEqual({
      id: mockUser.id,
      email: 'test@example.com',
      name: 'Test',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result).not.toHaveProperty('refreshToken');
    expect(repo.findByEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should throw DomainError when user not found', async () => {
    repo.findByEmail.mockResolvedValue(null);
    const query = new GetUserByEmailQuery('missing@example.com');

    await expect(handler.execute(query)).rejects.toBeInstanceOf(DomainError);
  });

  it('should throw DomainError for invalid email format', async () => {
    const query = new GetUserByEmailQuery('not-an-email');

    await expect(handler.execute(query)).rejects.toBeInstanceOf(DomainError);
    expect(repo.findByEmail).not.toHaveBeenCalled();
  });
});
