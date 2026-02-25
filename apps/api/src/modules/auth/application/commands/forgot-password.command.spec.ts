import { ForgotPasswordCommand, ForgotPasswordHandler } from './forgot-password.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { IEmailService } from '../../../email';
import { User } from '../../../user/domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';
import * as crypto from 'crypto';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(),
  createHash: jest.fn(),
}));

describe('ForgotPasswordHandler', () => {
  let handler: ForgotPasswordHandler;
  let repo: jest.Mocked<IUserRepository>;
  let emailService: jest.Mocked<IEmailService>;

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) =>
    User.load({
      id: '019450c4-5b12-7000-8000-000000000099',
      email: 'test@example.com',
      password: '$2a$10$hashedpassword',
      name: 'Test User',
      lastLoginAt: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      googleId: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: 0,
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
    };

    emailService = {
      sendEmail: jest.fn().mockResolvedValue(undefined),
    };

    const mockBuffer = Buffer.from('a'.repeat(32));
    (crypto.randomBytes as jest.Mock).mockReturnValue(mockBuffer);
    (crypto.createHash as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed-token'),
    });

    handler = new ForgotPasswordHandler(repo, emailService);
  });

  it('should reject invalid input', async () => {
    await expect(
      handler.execute(new ForgotPasswordCommand({ email: 'not-an-email' }))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should return silently if user not found', async () => {
    repo.findByEmail.mockResolvedValue(null);

    await handler.execute(new ForgotPasswordCommand({ email: 'unknown@example.com' }));

    expect(emailService.sendEmail).not.toHaveBeenCalled();
  });

  it('should not send email for Google-only user (no password)', async () => {
    const user = createUser({ password: null });
    repo.findByEmail.mockResolvedValue(user);

    await handler.execute(new ForgotPasswordCommand({ email: 'test@example.com' }));

    expect(emailService.sendEmail).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('should generate token, store hash, and send email for valid user', async () => {
    const user = createUser();
    repo.findByEmail.mockResolvedValue(user);

    await handler.execute(new ForgotPasswordCommand({ email: 'test@example.com' }));

    expect(repo.update).toHaveBeenCalledWith(user.id, expect.any(User));
    const updatedUser = repo.update.mock.calls[0][1] as User;
    expect(updatedUser.passwordResetToken).toBe('hashed-token');
    expect(updatedUser.passwordResetExpiresAt).toBeInstanceOf(Date);
    expect(emailService.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'test@example.com',
        subject: 'Password Reset',
      })
    );
  });

  it('should include userId and token in email link', async () => {
    const user = createUser();
    repo.findByEmail.mockResolvedValue(user);

    await handler.execute(new ForgotPasswordCommand({ email: 'test@example.com' }));

    const emailCall = emailService.sendEmail.mock.calls[0][0];
    expect(emailCall.html).toContain('token=');
    expect(emailCall.html).toContain('id=');
  });
});
