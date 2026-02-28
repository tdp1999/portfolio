import { ResetPasswordCommand, ResetPasswordHandler } from './reset-password.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { User } from '../../../user/domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';
import { AuthErrorCode } from '@portfolio/shared/errors';
import * as crypto from 'crypto';
import * as hashUtil from '@portfolio/shared/utils';

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  createHash: jest.fn(),
}));

describe('ResetPasswordHandler', () => {
  let handler: ResetPasswordHandler;
  let repo: jest.Mocked<IUserRepository>;

  const userId = '019450c4-5b12-7000-8000-000000000099';
  const validDto = { token: 'raw-token', userId, newPassword: 'NewPass1!' };

  const createUser = (overrides: Partial<Record<string, unknown>> = {}) =>
    User.load({
      id: userId,
      email: 'test@example.com',
      password: '$2a$10$hashedpassword',
      name: 'Test User',
      lastLoginAt: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      passwordResetToken: 'hashed-token',
      passwordResetExpiresAt: new Date(Date.now() + 3600000),
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

    (crypto.createHash as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('hashed-token'),
    });

    handler = new ResetPasswordHandler(repo);
  });

  it('should reject invalid input', async () => {
    await expect(
      handler.execute(new ResetPasswordCommand({ token: '', userId: '', newPassword: '' }))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should reject if user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(handler.execute(new ResetPasswordCommand(validDto))).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_RESET_TOKEN,
    });
  });

  it('should reject if no reset token stored on user', async () => {
    const user = createUser({ passwordResetToken: null, passwordResetExpiresAt: null });
    repo.findById.mockResolvedValue(user);

    await expect(handler.execute(new ResetPasswordCommand(validDto))).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_RESET_TOKEN,
    });
  });

  it('should reject if token hash does not match', async () => {
    (crypto.createHash as jest.Mock).mockReturnValue({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('different-hash'),
    });
    const user = createUser();
    repo.findById.mockResolvedValue(user);

    await expect(handler.execute(new ResetPasswordCommand(validDto))).rejects.toMatchObject({
      errorCode: AuthErrorCode.INVALID_RESET_TOKEN,
    });
  });

  it('should reject if token is expired', async () => {
    const user = createUser({ passwordResetExpiresAt: new Date(Date.now() - 1000) });
    repo.findById.mockResolvedValue(user);

    await expect(handler.execute(new ResetPasswordCommand(validDto))).rejects.toMatchObject({
      errorCode: AuthErrorCode.RESET_TOKEN_EXPIRED,
    });
  });

  it('should update password, clear reset token, and increment tokenVersion on success', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'hashPassword').mockResolvedValue('new-hashed-pw');

    await handler.execute(new ResetPasswordCommand(validDto));

    const updatedUser = repo.update.mock.calls[0][1] as User;
    expect(updatedUser.password).toBe('new-hashed-pw');
    expect(updatedUser.passwordResetToken).toBeNull();
    expect(updatedUser.passwordResetExpiresAt).toBeNull();
    expect(updatedUser.tokenVersion).toBe(1);
    expect(hashUtil.hashPassword).toHaveBeenCalledWith('NewPass1!');
  });
});
