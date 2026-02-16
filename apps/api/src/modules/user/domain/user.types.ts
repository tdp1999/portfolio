export interface IUserProps {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  lastLoginAt: Date | null;
  refreshToken: string | null;
  refreshTokenExpiresAt: Date | null;
  passwordResetToken: string | null;
  passwordResetExpiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserPayload {
  email: string;
  passwordHash: string;
  name: string;
}
