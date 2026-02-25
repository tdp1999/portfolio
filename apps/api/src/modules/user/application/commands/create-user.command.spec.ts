import { DomainError } from '@portfolio/shared/errors';
import { CreateUserCommand, CreateUserHandler } from './create-user.command';
import { IUserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';

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
    const command = new CreateUserCommand({
      email: 'test@example.com',
      password: 'Strong#Pass1',
      name: 'John',
    });

    const result = await handler.execute(command);

    expect(result).toBe('generated-id');
    expect(repo.add).toHaveBeenCalledTimes(1);
    const user = repo.add.mock.calls[0][0];
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('John');
  });

  it('should hash the password before storing', async () => {
    const command = new CreateUserCommand({
      email: 'test@example.com',
      password: 'Strong#Pass1',
      name: 'John',
    });

    await handler.execute(command);

    const user = repo.add.mock.calls[0][0];
    expect(user.password).not.toBe('Strong#Pass1');
    expect(user.password).toMatch(/^\$2[aby]?\$/);
  });

  it('should throw DomainError for invalid dto', async () => {
    const command = new CreateUserCommand({ email: 'not-an-email' });

    await expect(handler.execute(command)).rejects.toBeInstanceOf(DomainError);
  });

  it('should throw DomainError when email is already taken', async () => {
    const existingUser = User.create({
      email: 'test@example.com',
      password: 'hash',
      name: 'Existing',
    });
    repo.findByEmail.mockResolvedValue(existingUser);

    const command = new CreateUserCommand({
      email: 'test@example.com',
      password: 'Strong#Pass1',
      name: 'John',
    });

    await expect(handler.execute(command)).rejects.toBeInstanceOf(DomainError);
    expect(repo.add).not.toHaveBeenCalled();
  });

  it('should set timestamp on command', () => {
    const command = new CreateUserCommand({});
    expect(command.timestamp).toBeInstanceOf(Date);
  });
});
