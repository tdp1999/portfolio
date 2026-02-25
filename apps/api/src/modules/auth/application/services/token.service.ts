import { Inject, Injectable } from '@nestjs/common';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { hash, compare } from 'bcryptjs';
import { AUTH_CONFIG, AuthConfig } from '../auth.config';

export type AccessTokenPayload = {
  sub: string;
  tokenVersion: number;
  iat: number;
  exp: number;
};

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(AUTH_CONFIG) private readonly config: AuthConfig
  ) {}

  signAccessToken(userId: string, tokenVersion: number): string {
    return this.jwtService.sign({ sub: userId, tokenVersion }, {
      secret: this.config.jwtSecret,
      expiresIn: this.config.jwtAccessExpiry,
    } as JwtSignOptions);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwtService.verify<AccessTokenPayload>(token, {
      secret: this.config.jwtSecret,
    });
  }

  generateRefreshToken(): string {
    return randomBytes(32).toString('hex');
  }

  async hashRefreshToken(token: string): Promise<string> {
    return hash(token, 10);
  }

  async compareRefreshToken(token: string, hashedToken: string): Promise<boolean> {
    return compare(token, hashedToken);
  }
}
