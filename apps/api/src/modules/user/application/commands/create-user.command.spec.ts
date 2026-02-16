import { CreateUserCommand, CreateUserHandler } from './create-user.command';
import { IUserRepository } from '../ports/user.repository.port';

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let repo: jest.Mocked<IUserRepository>;

  beforeEach(() => {
    repo = {
      add: jest.fn().mockResolvedValue('generated-id'),
      update: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    handler = new CreateUserHandler(repo);
  });

  it('should create a user and return the id', async () => {
    const command = new CreateUserCommand('test@example.com', 'hashed-password', 'John');

    const result = await handler.execute(command);

    expect(result).toBe('generated-id');
    expect(repo.add).toHaveBeenCalledTimes(1);
    const user = repo.add.mock.calls[0][0];
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('John');
    expect(user.passwordHash).toBe('hashed-password');
  });

  it('should set timestamp on command', () => {
    const command = new CreateUserCommand('a@b.com', 'hash', 'Name');
    expect(command.timestamp).toBeInstanceOf(Date);
  });
});
