import { User } from './user.entity';
import { IUserProps } from '../user.types';

describe('User Entity', () => {
  const validProps: IUserProps = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
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
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  describe('create()', () => {
    it('should create a new user with generated id and timestamps', () => {
      const user = User.create({
        email: 'new@example.com',
        password: '$2b$10$hash',
        name: 'New User',
      });

      expect(user.id).toBeDefined();
      expect(user.email).toBe('new@example.com');
      expect(user.password).toBe('$2b$10$hash');
      expect(user.name).toBe('New User');
      expect(user.lastLoginAt).toBeNull();
      expect(user.refreshToken).toBeNull();
      expect(user.refreshTokenExpiresAt).toBeNull();
      expect(user.passwordResetToken).toBeNull();
      expect(user.passwordResetExpiresAt).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('load()', () => {
    it('should load a user from existing props', () => {
      const user = User.load(validProps);

      expect(user.id).toBe(validProps.id);
      expect(user.email).toBe(validProps.email);
      expect(user.password).toBe(validProps.password);
      expect(user.name).toBe(validProps.name);
      expect(user.createdAt).toBe(validProps.createdAt);
      expect(user.updatedAt).toBe(validProps.updatedAt);
    });
  });

  describe('toProps()', () => {
    it('should return a shallow copy of props', () => {
      const user = User.load(validProps);
      const props = user.toProps();

      expect(props).toEqual(validProps);
      expect(props).not.toBe(validProps);
    });
  });

  describe('updateLastLogin()', () => {
    it('should return a new user with updated lastLoginAt and updatedAt', () => {
      const user = User.load(validProps);
      const updated = user.updateLastLogin();

      expect(updated.lastLoginAt).toBeInstanceOf(Date);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(user.updatedAt.getTime());
      expect(updated).not.toBe(user);
    });
  });

  describe('setRefreshToken()', () => {
    it('should return a new user with refresh token set', () => {
      const user = User.load(validProps);
      const expiresAt = new Date('2026-02-01');
      const updated = user.setRefreshToken('token123', expiresAt);

      expect(updated.refreshToken).toBe('token123');
      expect(updated.refreshTokenExpiresAt).toBe(expiresAt);
      expect(updated).not.toBe(user);
    });
  });

  describe('clearRefreshToken()', () => {
    it('should return a new user with refresh token cleared', () => {
      const user = User.load({
        ...validProps,
        refreshToken: 'token123',
        refreshTokenExpiresAt: new Date('2026-02-01'),
      });
      const updated = user.clearRefreshToken();

      expect(updated.refreshToken).toBeNull();
      expect(updated.refreshTokenExpiresAt).toBeNull();
    });
  });

  describe('setPasswordResetToken()', () => {
    it('should return a new user with password reset token set', () => {
      const user = User.load(validProps);
      const expiresAt = new Date('2026-02-01');
      const updated = user.setPasswordResetToken('reset123', expiresAt);

      expect(updated.passwordResetToken).toBe('reset123');
      expect(updated.passwordResetExpiresAt).toBe(expiresAt);
      expect(updated).not.toBe(user);
    });
  });

  describe('clearPasswordResetToken()', () => {
    it('should return a new user with password reset token cleared', () => {
      const user = User.load({
        ...validProps,
        passwordResetToken: 'reset123',
        passwordResetExpiresAt: new Date('2026-02-01'),
      });
      const updated = user.clearPasswordResetToken();

      expect(updated.passwordResetToken).toBeNull();
      expect(updated.passwordResetExpiresAt).toBeNull();
    });
  });

  describe('incrementFailedAttempts()', () => {
    it('should return a new user with failedLoginAttempts incremented by 1', () => {
      const user = User.load(validProps);
      const updated = user.incrementFailedAttempts();

      expect(updated.failedLoginAttempts).toBe(1);
      expect(updated).not.toBe(user);
    });

    it('should increment from existing count', () => {
      const user = User.load({ ...validProps, failedLoginAttempts: 3 });
      const updated = user.incrementFailedAttempts();

      expect(updated.failedLoginAttempts).toBe(4);
    });
  });

  describe('lock()', () => {
    it('should return a new user with lockedUntil set', () => {
      const user = User.load(validProps);
      const until = new Date('2026-03-01');
      const updated = user.lock(until);

      expect(updated.lockedUntil).toBe(until);
      expect(updated).not.toBe(user);
    });
  });

  describe('resetFailedAttempts()', () => {
    it('should reset counter to 0 and clear lockedUntil', () => {
      const user = User.load({
        ...validProps,
        failedLoginAttempts: 5,
        lockedUntil: new Date('2026-03-01'),
      });
      const updated = user.resetFailedAttempts();

      expect(updated.failedLoginAttempts).toBe(0);
      expect(updated.lockedUntil).toBeNull();
      expect(updated).not.toBe(user);
    });
  });

  describe('incrementTokenVersion()', () => {
    it('should return a new user with tokenVersion incremented by 1', () => {
      const user = User.load(validProps);
      const updated = user.incrementTokenVersion();

      expect(updated.tokenVersion).toBe(1);
      expect(updated).not.toBe(user);
    });
  });

  describe('linkGoogle()', () => {
    it('should return a new user with googleId set', () => {
      const user = User.load(validProps);
      const updated = user.linkGoogle('google-123');

      expect(updated.googleId).toBe('google-123');
      expect(updated).not.toBe(user);
    });
  });

  describe('isLocked()', () => {
    it('should return false when lockedUntil is null', () => {
      const user = User.load(validProps);

      expect(user.isLocked()).toBe(false);
    });

    it('should return false when lockedUntil is in the past', () => {
      const user = User.load({
        ...validProps,
        lockedUntil: new Date('2020-01-01'),
      });

      expect(user.isLocked()).toBe(false);
    });

    it('should return true when lockedUntil is in the future', () => {
      const user = User.load({
        ...validProps,
        lockedUntil: new Date('2099-01-01'),
      });

      expect(user.isLocked()).toBe(true);
    });
  });

  describe('create() with Google user', () => {
    it('should create a user with null password and googleId', () => {
      const user = User.create({
        email: 'google@example.com',
        password: null,
        name: 'Google User',
        googleId: 'google-456',
      });

      expect(user.password).toBeNull();
      expect(user.googleId).toBe('google-456');
    });
  });
});
