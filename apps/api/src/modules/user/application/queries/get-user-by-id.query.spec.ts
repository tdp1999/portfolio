import { GetUserByIdQuery, GetUserByIdHandler } from './get-user-by-id.query';
import { IUserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';

describe('GetUserByIdHandler', () => {
  let handler: GetUserByIdHandler;
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
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn(),
    };
    handler = new GetUserByIdHandler(repo);
  });

  it('should return user by id', async () => {
    const query = new GetUserByIdQuery(mockUser.id);
    const result = await handler.execute(query);

    expect(result).toBe(mockUser);
    expect(repo.findById).toHaveBeenCalledWith(mockUser.id);
  });

  it('should return null when user not found', async () => {
    repo.findById.mockResolvedValue(null);
    const query = new GetUserByIdQuery('missing-id');
    const result = await handler.execute(query);

    expect(result).toBeNull();
  });
});
