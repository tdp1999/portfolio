import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAccessGuard } from './jwt-access.guard';
import { TokenService } from '../services/token.service';
import { IUserRepository } from '../../../user/application/ports/user.repository.port';
import { User } from '../../../user/domain/entities/user.entity';

describe('JwtAccessGuard', () => {
  let guard: JwtAccessGuard;
  let tokenService: jest.Mocked<Pick<TokenService, 'verifyAccessToken'>>;
  let userRepository: jest.Mocked<IUserRepository>;

  const mockUser = User.load({
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed',
    name: 'Test User',
    lastLoginAt: null,
    refreshToken: null,
    refreshTokenExpiresAt: null,
    passwordResetToken: null,
    passwordResetExpiresAt: null,
    googleId: null,
    failedLoginAttempts: 0,
    lockedUntil: null,
    tokenVersion: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  function createMockContext(authHeader?: string): ExecutionContext {
    const request: Record<string, any> = { headers: {} };
    if (authHeader !== undefined) {
      request['headers']['authorization'] = authHeader;
    }
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    tokenService = {
      verifyAccessToken: jest.fn(),
    };
    userRepository = {
      add: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
    };
    guard = new JwtAccessGuard(tokenService as unknown as TokenService, userRepository);
  });

  it('should throw UnauthorizedException when no Authorization header', async () => {
    const ctx = createMockContext();
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when Authorization header has no Bearer prefix', async () => {
    const ctx = createMockContext('Basic abc123');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when token is invalid', async () => {
    tokenService.verifyAccessToken.mockImplementation(() => {
      throw new Error('invalid token');
    });
    const ctx = createMockContext('Bearer invalid-token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user not found', async () => {
    tokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-123',
      tokenVersion: 3,
      iat: 0,
      exp: 0,
    });
    userRepository.findById.mockResolvedValue(null);
    const ctx = createMockContext('Bearer valid-token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when tokenVersion does not match', async () => {
    tokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-123',
      tokenVersion: 2, // mismatch — user has version 3
      iat: 0,
      exp: 0,
    });
    userRepository.findById.mockResolvedValue(mockUser);
    const ctx = createMockContext('Bearer valid-token');
    await expect(guard.canActivate(ctx)).rejects.toThrow(UnauthorizedException);
  });

  it('should set request.user and return true for valid token with matching version', async () => {
    tokenService.verifyAccessToken.mockReturnValue({
      sub: 'user-123',
      tokenVersion: 3,
      iat: 0,
      exp: 0,
    });
    userRepository.findById.mockResolvedValue(mockUser);
    const ctx = createMockContext('Bearer valid-token');
    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);

    const request = ctx.switchToHttp().getRequest() as any;
    expect(request.user).toBeDefined();
    expect(request.user.id).toBe('user-123');
  });
});
