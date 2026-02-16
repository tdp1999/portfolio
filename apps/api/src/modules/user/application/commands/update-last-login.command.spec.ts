import { NotFoundException } from '@nestjs/common';
import { UpdateLastLoginCommand, UpdateLastLoginHandler } from './update-last-login.command';
import { IUserRepository } from '../ports/user.repository.port';
import { User } from '../../domain/entities/user.entity';

describe('UpdateLastLoginHandler', () => {
  let handler: UpdateLastLoginHandler;
  let repo: jest.Mocked<IUserRepository>;

  const mockUser = User.create({
    email: 'test@example.com',
    passwordHash: 'hash',
    name: 'Test',
  });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn().mockResolvedValue(true),
      findById: jest.fn().mockResolvedValue(mockUser),
      findByEmail: jest.fn(),
    };
    handler = new UpdateLastLoginHandler(repo);
  });

  it('should update last login timestamp', async () => {
    const command = new UpdateLastLoginCommand(mockUser.id);

    await handler.execute(command);

    expect(repo.findById).toHaveBeenCalledWith(mockUser.id);
    expect(repo.update).toHaveBeenCalledTimes(1);
    const updated = repo.update.mock.calls[0][1];
    expect(updated.lastLoginAt).toBeInstanceOf(Date);
  });

  it('should throw NotFoundException when user not found', async () => {
    repo.findById.mockResolvedValue(null);
    const command = new UpdateLastLoginCommand('missing-id');

    await expect(handler.execute(command)).rejects.toThrow(NotFoundException);
  });
});
