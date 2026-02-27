import { JwtService } from '@nestjs/jwt';
import { TokenService } from './token.service';
import { AuthConfig } from '../auth.config';

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

  describe('signRefreshToken', () => {
    it('should return a JWT string', () => {
      const token = tokenService.signRefreshToken('user-123', 0);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId and tokenVersion in payload', () => {
      const token = tokenService.signRefreshToken('user-123', 3);
      const payload = jwtService.verify(token, { secret: config.jwtRefreshSecret });
      expect(payload.sub).toBe('user-123');
      expect(payload.tokenVersion).toBe(3);
    });

    it('should be signed with refresh secret, not access secret', () => {
      const token = tokenService.signRefreshToken('user-123', 0);
      expect(() => jwtService.verify(token, { secret: config.jwtSecret })).toThrow();
      expect(() => jwtService.verify(token, { secret: config.jwtRefreshSecret })).not.toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return payload for a valid refresh token', () => {
      const token = tokenService.signRefreshToken('user-123', 2);
      const payload = tokenService.verifyRefreshToken(token);
      expect(payload.sub).toBe('user-123');
      expect(payload.tokenVersion).toBe(2);
    });

    it('should throw for an invalid token', () => {
      expect(() => tokenService.verifyRefreshToken('invalid-token')).toThrow();
    });

    it('should throw for a token signed with access secret', () => {
      const token = tokenService.signAccessToken('user-123', 0);
      expect(() => tokenService.verifyRefreshToken(token)).toThrow();
    });
  });
});
