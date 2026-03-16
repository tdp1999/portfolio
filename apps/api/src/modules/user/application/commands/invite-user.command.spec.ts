import { InviteUserCommand, InviteUserHandler } from './invite-user.command';
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

describe('InviteUserHandler', () => {
  let handler: InviteUserHandler;
  let repo: jest.Mocked<IUserRepository>;
  let emailService: jest.Mocked<IEmailService>;

  const validDto = { name: 'John Doe', email: 'john@example.com' };

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
      inviteToken: null,
      inviteTokenExpiresAt: null,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      ...overrides,
    });

  beforeEach(() => {
    repo = {
      add: jest.fn().mockResolvedValue('new-user-id'),
      update: jest.fn().mockResolvedValue(true),
      findById: jest.fn(),
      findByEmail: jest.fn().mockResolvedValue(null),
      findAll: jest.fn(),
      findByEmailIncludingDeleted: jest.fn().mockResolvedValue(null),
    };

    emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockBuffer = Buffer.from('a'.repeat(32));
    (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);
    (crypto.createHash as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed-invite-token'),
    });

    handler = new InviteUserHandler(repo, emailService);
  });

  it('should reject invalid input', async () => {
    await expect(handler.execute(new InviteUserCommand({ email: 'bad' }, 'admin-1'))).rejects.toBeInstanceOf(
      DomainError
    );
  });

  it('should create user and send invite email on success', async () => {
    const result = await handler.execute(new InviteUserCommand(validDto, 'admin-1'));

    expect(repo.findByEmailIncludingDeleted).toHaveBeenCalledWith('john@example.com');
    expect(repo.add).toHaveBeenCalled();
    const addedUser = repo.add.mock.calls[0][0] as User;
    expect(addedUser.email).toBe('john@example.com');
    expect(addedUser.name).toBe('John Doe');
    expect(addedUser.password).toBeNull();
    expect(addedUser.inviteToken).toBe('hashed-invite-token');
    expect(addedUser.inviteTokenExpiresAt).toBeInstanceOf(Date);

    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'john@example.com',
        subject: 'You have been invited',
      })
    );

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('email', 'john@example.com');
  });

  it('should throw ConflictError if email already exists', async () => {
    repo.findByEmailIncludingDeleted.mockResolvedValue(createUser());

    await expect(handler.execute(new InviteUserCommand(validDto, 'admin-1'))).rejects.toMatchObject({
      statusCode: 409,
      message: 'Email is already taken',
    });
  });

  it('should restore soft-deleted user and re-invite', async () => {
    const deletedUser = createUser({ deletedAt: new Date('2024-01-01') });
    repo.findByEmailIncludingDeleted.mockResolvedValue(deletedUser);

    const result = await handler.execute(new InviteUserCommand(validDto, 'admin-1'));

    // Should call update, not add
    expect(repo.update).toHaveBeenCalledWith('user-id-123', expect.any(Object));
    expect(repo.add).not.toHaveBeenCalled();
    expect(emailService.sendEmail).toHaveBeenCalled();
    expect(result).toHaveProperty('email', 'john@example.com');
  });

  it('should propagate email send failure', async () => {
    emailService.sendEmail.mockRejectedValue(new Error('SMTP error'));

    await expect(handler.execute(new InviteUserCommand(validDto, 'admin-1'))).rejects.toThrow('SMTP error');
  });

  it('should default role to USER', async () => {
    await handler.execute(new InviteUserCommand(validDto, 'admin-1'));

    const addedUser = repo.add.mock.calls[0][0] as User;
    expect(addedUser.role).toBe('USER');
  });

  it('should allow specifying ADMIN role', async () => {
    await handler.execute(new InviteUserCommand({ ...validDto, role: 'ADMIN' }, 'admin-1'));

    const addedUser = repo.add.mock.calls[0][0] as User;
    expect(addedUser.role).toBe('ADMIN');
  });
});
