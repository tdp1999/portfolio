import { IdentifierValue, TemporalValue } from '@portfolio/shared/types';
import { ICreateUserPayload, IUserProps } from '../user.types';

export class User {
  private constructor(private readonly props: IUserProps) {}

  static create(data: ICreateUserPayload): User {
    const now = TemporalValue.now();
    return new User({
      id: IdentifierValue.v7(),
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      lastLoginAt: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
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

  get passwordHash(): string {
    return this.props.passwordHash;
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
