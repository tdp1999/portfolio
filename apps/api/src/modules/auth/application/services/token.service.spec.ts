import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { AUTH_CONFIG, AuthConfig } from '../auth.config';

describe('TokenService', () => {
  let tokenService: TokenService;
  let jwtService: JwtService;

  const config: AuthConfig = {
    jwtSecret: 'test-secret',
    jwtAccessExpiry: '15m',
    jwtRefreshSecret: 'test-refresh-secret',
    jwtRefreshExpiry: '30d',
  };

  beforeEach(() => {
    jwtService = new JwtService({ secret: config.jwtSecret });
    tokenService = new TokenService(jwtService, config);
  });

  describe('signAccessToken', () => {
    it('should return a JWT string', () => {
      const token = tokenService.signAccessToken('user-123', 0);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId and tokenVersion in payload', () => {
      const token = tokenService.signAccessToken('user-123', 5);
      const payload = jwtService.verify(token, { secret: config.jwtSecret });
      expect(payload.sub).toBe('user-123');
      expect(payload.tokenVersion).toBe(5);
    });
  });

  describe('verifyAccessToken', () => {
    it('should return payload for a valid token', () => {
      const token = tokenService.signAccessToken('user-123', 0);
      const payload = tokenService.verifyAccessToken(token);
      expect(payload.sub).toBe('user-123');
      expect(payload.tokenVersion).toBe(0);
    });

    it('should throw for an invalid token', () => {
      expect(() => tokenService.verifyAccessToken('invalid-token')).toThrow();
    });

    it('should throw for a token signed with wrong secret', () => {
      const otherJwt = new JwtService({ secret: 'wrong-secret' });
      const token = otherJwt.sign({ sub: 'user-123' });
      expect(() => tokenService.verifyAccessToken(token)).toThrow();
    });
  });

  describe('generateRefreshToken', () => {
    it('should return a string', () => {
      const token = tokenService.generateRefreshToken();
      expect(typeof token).toBe('string');
    });

    it('should generate unique tokens', () => {
      const token1 = tokenService.generateRefreshToken();
      const token2 = tokenService.generateRefreshToken();
      expect(token1).not.toBe(token2);
    });

    it('should be at least 32 bytes (64 hex chars)', () => {
      const token = tokenService.generateRefreshToken();
      expect(token.length).toBeGreaterThanOrEqual(64);
    });
  });

  describe('hashRefreshToken / compareRefreshToken', () => {
    it('should hash and verify a refresh token', async () => {
      const token = 'my-refresh-token';
      const hash = await tokenService.hashRefreshToken(token);
      expect(hash).not.toBe(token);
      const match = await tokenService.compareRefreshToken(token, hash);
      expect(match).toBe(true);
    });

    it('should reject a wrong token', async () => {
      const hash = await tokenService.hashRefreshToken('correct-token');
      const match = await tokenService.compareRefreshToken('wrong-token', hash);
      expect(match).toBe(false);
    });
  });
});
