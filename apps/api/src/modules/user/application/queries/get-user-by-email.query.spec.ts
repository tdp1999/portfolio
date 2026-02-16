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

  it('should return user by email', async () => {
    const query = new GetUserByEmailQuery('test@example.com');
    const result = await handler.execute(query);

    expect(result).toBe(mockUser);
    expect(repo.findByEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should return null when user not found', async () => {
    repo.findByEmail.mockResolvedValue(null);
    const query = new GetUserByEmailQuery('missing@example.com');
    const result = await handler.execute(query);

    expect(result).toBeNull();
  });
});
