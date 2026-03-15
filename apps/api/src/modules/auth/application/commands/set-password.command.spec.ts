import { SetPasswordCommand, SetPasswordHandler } from './set-password.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { User } from '../../../user/domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';
import * as crypto from 'crypto';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createHash: jest.fn(),
  timingSafeEqual: jest.fn(),
}));

jest.mock('@portfolio/shared/utils', () => ({
  ...jest.requireActual('@portfolio/shared/utils'),
  hashPassword: jest.fn().mockResolvedValue('$2a$10$newhashed'),
}));

describe('SetPasswordHandler', () => {
  let handler: SetPasswordHandler;
  let repo: jest.Mocked<IUserRepository>;

  const validDto = {
    token: 'raw-invite-token',
    userId: 'user-id-123',
    newPassword: 'StrongPass1@',
  };

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) =>
    User.load({
      id: 'user-id-123',
      email: 'john@example.com',
      password: null,
      name: 'John Doe',
      role: 'USER',
      lastLoginAt: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      googleId: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: 0,
      deletedAt: null,
      inviteToken: 'ab'.repeat(32),
      inviteTokenExpiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    });

  beforeEach(() => {
    repo = {
      add: jest.fn(),
      update: jest.fn().mockResolvedValue(true),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findAll: jest.fn(),
    };

    (crypto.createHash as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('ab'.repeat(32)),
    });
    (crypto.timingSafeEqual as jest.Mock).mockReturnValue(true);

    handler = new SetPasswordHandler(repo);
  });

  it('should reject invalid input', async () => {
    await expect(
      handler.execute(new SetPasswordCommand({ token: '', userId: '', newPassword: '' }))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should set password and clear invite token on success', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    await handler.execute(new SetPasswordCommand(validDto));

    expect(repo.update).toHaveBeenCalledWith(
      'user-id-123',
      expect.objectContaining({
        password: '$2a$10$newhashed',
        inviteToken: null,
        inviteTokenExpiresAt: null,
      })
    );
  });

  it('should throw if user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(handler.execute(new SetPasswordCommand(validDto))).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid or expired invite token',
    });
  });

  it('should throw if invite token does not match', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);
    (crypto.timingSafeEqual as jest.Mock).mockReturnValue(false);

    await expect(handler.execute(new SetPasswordCommand(validDto))).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invalid or expired invite token',
    });
  });

  it('should throw if invite token is expired', async () => {
    const user = createUser({ inviteTokenExpiresAt: new Date(Date.now() - 1000) });
    repo.findById.mockResolvedValue(user);

    await expect(handler.execute(new SetPasswordCommand(validDto))).rejects.toMatchObject({
      statusCode: 400,
      message: 'Invite token has expired',
    });
  });

  it('should throw if user has no invite token', async () => {
    const user = createUser({ inviteToken: null, inviteTokenExpiresAt: null });
    repo.findById.mockResolvedValue(user);

    await expect(handler.execute(new SetPasswordCommand(validDto))).rejects.toMatchObject({
      statusCode: 400,
    });
  });
});
