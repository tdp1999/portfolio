import { ResendInviteCommand, ResendInviteHandler } from './resend-invite.command';
import { IUserRepository } from '../ports/user.repository.port';
import { IEmailService } from '../../../email';
import { User } from '../../domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';
import * as crypto from 'crypto';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(),
  createHash: jest.fn(),
}));

describe('ResendInviteHandler', () => {
  let handler: ResendInviteHandler;
  let repo: jest.Mocked<IUserRepository>;
  let emailService: jest.Mocked<IEmailService>;

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
      inviteToken: 'old-hashed-token',
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

    emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockBuffer = Buffer.from('b'.repeat(32));
    (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);
    (crypto.createHash as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('new-hashed-token'),
    });

    handler = new ResendInviteHandler(repo, emailService);
  });

  it('should generate new token, update user, and resend email', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    await handler.execute(new ResendInviteCommand('user-id-123'));

    expect(repo.update).toHaveBeenCalledWith('user-id-123', expect.any(User));
    const updatedUser = repo.update.mock.calls[0][0 + 1] as User;
    expect(updatedUser.inviteToken).toBe('new-hashed-token');
    expect(updatedUser.inviteTokenExpiresAt).toBeInstanceOf(Date);

    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
      })
    );
  });

  it('should throw NotFoundError if user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(handler.execute(new ResendInviteCommand('non-existent'))).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('should throw ConflictError if user already activated', async () => {
    const user = createUser({ password: '$2a$10$hashedpassword' });
    repo.findById.mockResolvedValue(user);

    await expect(handler.execute(new ResendInviteCommand('user-id-123'))).rejects.toMatchObject({
      statusCode: 409,
      message: 'User has already activated their account.',
    });
  });
});
