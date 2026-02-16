import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { IUserProps } from '../../domain/user.types';
import { UserMapper } from './user.mapper';

describe('UserMapper', () => {
  const prismaUser: PrismaUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    passwordHash: '$2b$10$hash',
    name: 'Test User',
    lastLoginAt: null,
    refreshToken: null,
    refreshTokenExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  const userProps: IUserProps = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    passwordHash: '$2b$10$hash',
    name: 'Test User',
    lastLoginAt: null,
    refreshToken: null,
    refreshTokenExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  describe('toDomain()', () => {
    it('should convert Prisma user to domain entity', () => {
      const user = UserMapper.toDomain(prismaUser);

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe(prismaUser.id);
      expect(user.email).toBe(prismaUser.email);
      expect(user.passwordHash).toBe(prismaUser.passwordHash);
      expect(user.name).toBe(prismaUser.name);
      expect(user.lastLoginAt).toBe(prismaUser.lastLoginAt);
      expect(user.createdAt).toBe(prismaUser.createdAt);
    });

    it('should preserve nullable fields when set', () => {
      const withTokens: PrismaUser = {
        ...prismaUser,
        refreshToken: 'token',
        refreshTokenExpiresAt: new Date('2026-02-01'),
        lastLoginAt: new Date('2026-01-15'),
      };

      const user = UserMapper.toDomain(withTokens);

      expect(user.refreshToken).toBe('token');
      expect(user.refreshTokenExpiresAt).toEqual(new Date('2026-02-01'));
      expect(user.lastLoginAt).toEqual(new Date('2026-01-15'));
    });
  });

  describe('toPrisma()', () => {
    it('should convert domain entity to Prisma data', () => {
      const user = User.load(userProps);
      const data = UserMapper.toPrisma(user);

      expect(data.id).toBe(userProps.id);
      expect(data.email).toBe(userProps.email);
      expect(data.passwordHash).toBe(userProps.passwordHash);
      expect(data.name).toBe(userProps.name);
      expect(data).not.toHaveProperty('createdAt');
      expect(data).not.toHaveProperty('updatedAt');
    });

    it('should preserve non-null optional fields', () => {
      const user = User.load({
        ...userProps,
        refreshToken: 'token',
        refreshTokenExpiresAt: new Date('2026-02-01'),
        passwordResetToken: 'reset',
        passwordResetExpiresAt: new Date('2026-02-01'),
        lastLoginAt: new Date('2026-01-15'),
      });
      const data = UserMapper.toPrisma(user);

      expect(data.refreshToken).toBe('token');
      expect(data.refreshTokenExpiresAt).toEqual(new Date('2026-02-01'));
      expect(data.passwordResetToken).toBe('reset');
      expect(data.lastLoginAt).toEqual(new Date('2026-01-15'));
    });
  });
});
