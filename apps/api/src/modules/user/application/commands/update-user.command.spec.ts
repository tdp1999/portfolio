import { BadRequestException, NotFoundException } from '@nestjs/common';
import { UpdateUserCommand, UpdateUserHandler } from './update-user.command';
import { IUserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';

describe('UpdateUserHandler', () => {
  let handler: UpdateUserHandler;
  let repo: jest.Mocked<IUserRepository>;

  const mockUser = User.create({
    email: 'old@example.com',
    passwordHash: 'hash',
    name: 'Old Name',
  });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn().mockResolvedValue(true),
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn(),
    };
    handler = new UpdateUserHandler(repo);
  });

  it('should update user profile', async () => {
    const command = new UpdateUserCommand(mockUser.id, { name: 'New Name' });

    await handler.execute(command);

    expect(repo.findById).toHaveBeenCalledWith(mockUser.id);
    expect(repo.update).toHaveBeenCalledTimes(1);
    const updated = repo.update.mock.calls[0][1];
    expect(updated.name).toBe('New Name');
  });

  it('should throw BadRequestException for invalid dto', async () => {
    const command = new UpdateUserCommand(mockUser.id, { name: 123 });

    await expect(handler.execute(command)).rejects.toThrow(BadRequestException);
  });

  it('should throw NotFoundException when user not found', async () => {
    repo.findById.mockResolvedValue(null);
    const command = new UpdateUserCommand('missing-id', { name: 'X' });

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
