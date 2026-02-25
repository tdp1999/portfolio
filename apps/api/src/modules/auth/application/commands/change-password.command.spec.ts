import { ChangePasswordCommand, ChangePasswordHandler } from './change-password.command';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { User } from '../../../user/domain/entities/user.entity';
import { DomainError } from '@portfolio/shared/errors';
import { AuthErrorCode } from '../auth-error-code';
import * as hashUtil from '@portfolio/shared/utils';

describe('ChangePasswordHandler', () => {
  let handler: ChangePasswordHandler;
  let repo: jest.Mocked<IUserRepository>;

  const userId = '019450c4-5b12-7000-8000-000000000099';
  const validDto = { currentPassword: 'OldPass1!', newPassword: 'NewPass1!' };

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

    handler = new ChangePasswordHandler(repo);
  });

  it('should reject invalid input', async () => {
    await expect(
      handler.execute(new ChangePasswordCommand(userId, { currentPassword: '' }))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should reject if user not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new ChangePasswordCommand(userId, validDto))
    ).rejects.toBeInstanceOf(DomainError);
  });

  it('should reject if user has no password (Google-only)', async () => {
    const user = createUser({ password: null });
    repo.findById.mockResolvedValue(user);

    await expect(
      handler.execute(new ChangePasswordCommand(userId, validDto))
    ).rejects.toMatchObject({
      errorCode: AuthErrorCode.NO_PASSWORD,
    });
  });

  it('should reject if current password is wrong', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(false);

    await expect(
      handler.execute(new ChangePasswordCommand(userId, validDto))
    ).rejects.toMatchObject({
      errorCode: AuthErrorCode.WRONG_PASSWORD,
    });
  });

  it('should update password and increment tokenVersion on success', async () => {
    const user = createUser();
    repo.findById.mockResolvedValue(user);
    jest.spyOn(hashUtil, 'comparePassword').mockResolvedValue(true);
    jest.spyOn(hashUtil, 'hashPassword').mockResolvedValue('new-hashed-pw');

    await handler.execute(new ChangePasswordCommand(userId, validDto));

    const updatedUser = repo.update.mock.calls[0][1] as User;
    expect(updatedUser.password).toBe('new-hashed-pw');
    expect(updatedUser.tokenVersion).toBe(1);
    expect(hashUtil.hashPassword).toHaveBeenCalledWith('NewPass1!');
  });
});
