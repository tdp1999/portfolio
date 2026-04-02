import { User } from './user.entity';
import { IUserProps } from '../user.types';

describe('User Entity', () => {
  const validProps: IUserProps = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    name: 'Test User',
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
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  describe('create()', () => {
    it('should generate UUID, set defaults, and accept optional role', () => {
      const user = User.create({
        email: 'new@example.com',
        password: '$2b$10$hash',
        name: 'New User',
      });

      expect(user.id).toBeDefined();
      expect(user.role).toBe('USER');
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.tokenVersion).toBe(0);
      expect(user.deletedAt).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should create with specified role', () => {
      const user = User.create({
        email: 'admin@example.com',
        password: '$2b$10$hash',
        name: 'Admin User',
        role: 'ADMIN',
      });

      expect(user.role).toBe('ADMIN');
    });

    it('should create a Google user with null password', () => {
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

  describe('toPublicProps()', () => {
    it('should compute hasPassword and hasGoogleLinked', () => {
      const user = User.load(validProps);
      const publicProps = user.toPublicProps();

      expect(publicProps.hasPassword).toBe(true);
      expect(publicProps.hasGoogleLinked).toBe(false);
    });

    it('should show hasGoogleLinked true when googleId is set', () => {
      const user = User.load({ ...validProps, googleId: 'google-123' });

      expect(user.toPublicProps().hasGoogleLinked).toBe(true);
    });
  });

  describe('incrementFailedAttempts()', () => {
    it('should increment from 0', () => {
      const user = User.load(validProps);

      expect(user.incrementFailedAttempts().failedLoginAttempts).toBe(1);
    });

    it('should increment from existing count', () => {
      const user = User.load({ ...validProps, failedLoginAttempts: 3 });

      expect(user.incrementFailedAttempts().failedLoginAttempts).toBe(4);
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
    });
  });

  describe('isLocked()', () => {
    it('should return false when lockedUntil is null', () => {
      expect(User.load(validProps).isLocked()).toBe(false);
    });

    it('should return false when lockedUntil is in the past', () => {
      const user = User.load({ ...validProps, lockedUntil: new Date('2020-01-01') });

      expect(user.isLocked()).toBe(false);
    });

    it('should return true when lockedUntil is in the future', () => {
      const user = User.load({ ...validProps, lockedUntil: new Date('2099-01-01') });

      expect(user.isLocked()).toBe(true);
    });
  });

  describe('softDelete()', () => {
    it('should set deletedAt and return new instance', () => {
      const user = User.load(validProps);
      const deleted = user.softDelete();

      expect(deleted.deletedAt).toBeInstanceOf(Date);
      expect(deleted).not.toBe(user);
      expect(user.deletedAt).toBeNull();
    });
  });
});
