import { IdentifierValue, TemporalValue } from '@portfolio/shared/types';
import { ICreateUserPayload, IUserProps } from '../user.types';

export class User {
  private constructor(private readonly props: IUserProps) {}

  static create(data: ICreateUserPayload): User {
    const now = TemporalValue.now();
    return new User({
      id: IdentifierValue.v7(),
      email: data.email,
      password: data.password,
      name: data.name,
      lastLoginAt: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      googleId: data.googleId ?? null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      tokenVersion: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  static load(raw: IUserProps): User {
    return new User(raw);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get password(): string | null {
    return this.props.password;
  }

  get name(): string {
    return this.props.name;
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }

  get refreshToken(): string | null {
    return this.props.refreshToken;
  }

  get refreshTokenExpiresAt(): Date | null {
    return this.props.refreshTokenExpiresAt;
  }

  get passwordResetToken(): string | null {
    return this.props.passwordResetToken;
  }

  get passwordResetExpiresAt(): Date | null {
    return this.props.passwordResetExpiresAt;
  }

  get googleId(): string | null {
    return this.props.googleId;
  }

  get failedLoginAttempts(): number {
    return this.props.failedLoginAttempts;
  }

  get lockedUntil(): Date | null {
    return this.props.lockedUntil;
  }

  get tokenVersion(): number {
    return this.props.tokenVersion;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  updateLastLogin(): User {
    return new User({
      ...this.props,
      lastLoginAt: TemporalValue.now(),
      updatedAt: TemporalValue.now(),
    });
  }

  setRefreshToken(token: string, expiresAt: Date): User {
    return new User({
      ...this.props,
      refreshToken: token,
      refreshTokenExpiresAt: expiresAt,
      updatedAt: TemporalValue.now(),
    });
  }

  clearRefreshToken(): User {
    return new User({
      ...this.props,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      updatedAt: TemporalValue.now(),
    });
  }

  setPasswordResetToken(token: string, expiresAt: Date): User {
    return new User({
      ...this.props,
      passwordResetToken: token,
      passwordResetExpiresAt: expiresAt,
      updatedAt: TemporalValue.now(),
    });
  }

  updateProfile(data: { name?: string; email?: string }): User {
    return new User({
      ...this.props,
      ...(data.name !== undefined && { name: data.name }),
      ...(data.email !== undefined && { email: data.email }),
      updatedAt: TemporalValue.now(),
    });
  }

  clearPasswordResetToken(): User {
    return new User({
      ...this.props,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
      updatedAt: TemporalValue.now(),
    });
  }

  updatePassword(hashedPassword: string): User {
    return new User({
      ...this.props,
      password: hashedPassword,
      updatedAt: TemporalValue.now(),
    });
  }

  incrementFailedAttempts(): User {
    return new User({
      ...this.props,
      failedLoginAttempts: this.props.failedLoginAttempts + 1,
      updatedAt: TemporalValue.now(),
    });
  }

  lock(until: Date): User {
    return new User({
      ...this.props,
      lockedUntil: until,
      updatedAt: TemporalValue.now(),
    });
  }

  resetFailedAttempts(): User {
    return new User({
      ...this.props,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedAt: TemporalValue.now(),
    });
  }

  incrementTokenVersion(): User {
    return new User({
      ...this.props,
      tokenVersion: this.props.tokenVersion + 1,
      updatedAt: TemporalValue.now(),
    });
  }

  linkGoogle(googleId: string): User {
    return new User({
      ...this.props,
      googleId,
      updatedAt: TemporalValue.now(),
    });
  }

  isLocked(): boolean {
    return this.props.lockedUntil !== null && this.props.lockedUntil > new Date();
  }

  toProps(): IUserProps {
    return { ...this.props };
  }

  toPublicProps() {
    return {
      id: this.props.id,
      email: this.props.email,
      name: this.props.name,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    };
  }
}
