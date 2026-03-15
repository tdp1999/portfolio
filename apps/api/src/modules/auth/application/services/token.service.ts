import { Inject, Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { AUTH_CONFIG, AuthConfig } from '../auth.config';
import { UserRole } from '../../../user/domain/user.types';

export type AccessTokenPayload = {
  sub: string;
  role: UserRole;
  tokenVersion: number;
  iat: number;
  exp: number;
};

export type RefreshTokenPayload = {
  sub: string;
  tokenVersion: number;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig
  ) {}

  signAccessToken(userId: string, tokenVersion: number, role: UserRole): string {
    const options: JwtSignOptions = {
      secret: this.config.jwtSecret,
      expiresIn: this.config.jwtAccessExpiry,
    };
    return this.jwtService.sign({ sub: userId, tokenVersion, role }, options);
  }

  verifyAccessToken(token: string, options?: { ignoreExpiration?: boolean }): AccessTokenPayload {
    return this.jwtService.verify<AccessTokenPayload>(token, {
      secret: this.config.jwtSecret,
      ...options,
    });
  }

  signRefreshToken(userId: string, tokenVersion: number): string {
    const jti = randomBytes(16).toString('hex');
    const options: JwtSignOptions = {
      secret: this.config.jwtRefreshSecret,
      expiresIn: this.config.jwtRefreshExpiry,
    };
    return this.jwtService.sign({ sub: userId, tokenVersion, jti }, options);
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    return this.jwtService.verify<RefreshTokenPayload>(token, {
      secret: this.config.jwtRefreshSecret,
    });
  }
}
