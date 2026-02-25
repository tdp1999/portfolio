export interface IUserProps {
  id: string;
  email: string;
  password: string | null;
  name: string;
  lastLoginAt: Date | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
  passwordResetToken: string | null;
  passwordResetExpiresAt: Date | null;
  googleId: string | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  tokenVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserPayload {
  email: string;
  password: string | null;
  name: string;
  googleId?: string;
}
