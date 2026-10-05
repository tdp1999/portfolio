import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { MachineTokenGuard } from './machine-token.guard';

const TOKEN = 'worker-token-for-tests';
const hashOf = (token: string) => createHash('sha256').update(token).digest();

const contextWith = (authorization?: string) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers: authorization ? { authorization } : {} }) }),
  }) as unknown as ExecutionContext;

describe('MachineTokenGuard', () => {
  const guard = new MachineTokenGuard({ tokenHash: hashOf(TOKEN) });

  it('should allow a bearer token whose hash matches', () => {
    expect(guard.canActivate(contextWith(`Bearer ${TOKEN}`))).toBe(true);
  });

  it('should reject a token whose hash does not match', () => {
    expect(() => guard.canActivate(contextWith('Bearer someone-else'))).toThrow(UnauthorizedException);
  });

  it('should reject a missing or non-bearer authorization header', () => {
    expect(() => guard.canActivate(contextWith())).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(contextWith(TOKEN))).toThrow(UnauthorizedException);
  });

  it('should reject every token when no hash is configured', () => {
    const disabled = new MachineTokenGuard({ tokenHash: null });

    expect(() => disabled.canActivate(contextWith(`Bearer ${TOKEN}`))).toThrow(UnauthorizedException);
  });
});
