import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { IUserProps } from '../../domain/user.types';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    const props: IUserProps = {
      id: raw.id,
      email: raw.email,
      passwordHash: raw.passwordHash,
      name: raw.name,
      lastLoginAt: raw.lastLoginAt,
      refreshToken: raw.refreshToken,
      refreshTokenExpiresAt: raw.refreshTokenExpiresAt,
      passwordResetToken: raw.passwordResetToken,
      passwordResetExpiresAt: raw.passwordResetExpiresAt,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
    return User.load(props);
  }

  static toPrisma(user: User): Omit<PrismaUser, 'createdAt' | 'updatedAt'> {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      name: user.name,
      lastLoginAt: user.lastLoginAt,
      refreshToken: user.refreshToken,
      refreshTokenExpiresAt: user.refreshTokenExpiresAt,
      passwordResetToken: user.passwordResetToken,
      passwordResetExpiresAt: user.passwordResetExpiresAt,
    };
  }
}
