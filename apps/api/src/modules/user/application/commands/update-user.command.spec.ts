import { DomainError } from '@portfolio/shared/errors';
import { UpdateUserCommand, UpdateUserHandler } from './update-user.command';
import { IUserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';

describe('UpdateUserHandler', () => {
  let handler: UpdateUserHandler;
  let repo: jest.Mocked<IUserRepository>;

  const mockUser = User.create({
    email: 'old@example.com',
    password: 'hash',
    name: 'Old Name',
  });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn().mockResolvedValue(true),
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
      findByEmailIncludingDeleted: jest.fn(),
    };
    handler = new UpdateUserHandler(repo);
  });

  it('should update user profile when owner', async () => {
    const command = new UpdateUserCommand(mockUser.id, { name: 'New Name' }, mockUser.id, 'USER');

    await handler.execute(command);

    expect(repo.findById).toHaveBeenCalledWith(mockUser.id);
    expect(repo.update).toHaveBeenCalledTimes(1);
    const updated = repo.update.mock.calls[0][1];
    expect(updated.name).toBe('New Name');
  });

  it('should allow admin to update any user', async () => {
    const command = new UpdateUserCommand(mockUser.id, { name: 'Admin Edit' }, 'admin-id', 'ADMIN');

    await handler.execute(command);

    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('should throw ForbiddenError when user updates another user', async () => {
    const command = new UpdateUserCommand(mockUser.id, { name: 'Hack' }, 'other-user-id', 'USER');

    await expect(handler.execute(command)).rejects.toBeInstanceOf(DomainError);
    await expect(handler.execute(command)).rejects.toMatchObject({ statusCode: 403 });
  });

  it('should throw DomainError for invalid dto', async () => {
    const command = new UpdateUserCommand(mockUser.id, { name: 123 }, mockUser.id, 'USER');

    await expect(handler.execute(command)).rejects.toBeInstanceOf(DomainError);
  });

  it('should throw DomainError for invalid UUID', async () => {
    const command = new UpdateUserCommand('not-a-uuid', { name: 'X' }, 'some-id', 'USER');

    await expect(handler.execute(command)).rejects.toBeInstanceOf(DomainError);
    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('should throw DomainError when user not found', async () => {
    repo.findById.mockResolvedValue(null);
    const command = new UpdateUserCommand(mockUser.id, { name: 'X' }, mockUser.id, 'USER');

    await expect(handler.execute(command)).rejects.toBeInstanceOf(DomainError);
  });
});
