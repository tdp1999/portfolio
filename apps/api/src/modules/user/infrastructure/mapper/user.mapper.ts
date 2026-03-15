import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { IUserProps } from '../../domain/user.types';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    const props: IUserProps = {
      id: raw.id,
      email: raw.email,
      password: raw.password,
      name: raw.name,
      role: raw.role,
      lastLoginAt: raw.lastLoginAt,
      refreshToken: raw.refreshToken,
      refreshTokenExpiresAt: raw.refreshTokenExpiresAt,
      passwordResetToken: raw.passwordResetToken,
      passwordResetExpiresAt: raw.passwordResetExpiresAt,
      googleId: raw.googleId,
      failedLoginAttempts: raw.failedLoginAttempts,
      lockedUntil: raw.lockedUntil,
      tokenVersion: raw.tokenVersion,
      deletedAt: raw.deletedAt,
      inviteToken: raw.inviteToken,
      inviteTokenExpiresAt: raw.inviteTokenExpiresAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
    return User.load(props);
  }

  static toPrisma(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    return {
      id: user.id,
      email: user.email,
      password: user.password,
      name: user.name,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
      refreshToken: user.refreshToken,
      refreshTokenExpiresAt: user.refreshTokenExpiresAt,
      passwordResetToken: user.passwordResetToken,
      passwordResetExpiresAt: user.passwordResetExpiresAt,
      googleId: user.googleId,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil,
      tokenVersion: user.tokenVersion,
      deletedAt: user.deletedAt,
      inviteToken: user.inviteToken,
      inviteTokenExpiresAt: user.inviteTokenExpiresAt,
    };
  }
}
