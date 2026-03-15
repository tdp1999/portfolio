export type UserRole = 'ADMIN' | 'USER';

export interface IUserProps {
  id: string;
  email: string;
  password: string | null;
  name: string;
  role: UserRole;
  lastLoginAt: Date | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
  passwordResetToken: string | null;
  passwordResetExpiresAt: Date | null;
  googleId: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  tokenVersion: number;
  deletedAt: Date | null;
  inviteToken: string | null;
  inviteTokenExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserPayload {
  email: string;
  password: string | null;
  name: string;
  role?: UserRole;
  googleId?: string;
}
