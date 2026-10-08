import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { ChecklistSyncTokenGuard } from './checklist-sync-token.guard';

const TOKEN = 'sync-token-for-tests';
const hashOf = (token: string) => createHash('sha256').update(token).digest();

const contextWith = (authorization?: string) =>
  ({
    switchToHttp: () => ({ getRequest: () => ({ headers: authorization ? { authorization } : {} }) }),
  }) as unknown as ExecutionContext;

describe('ChecklistSyncTokenGuard', () => {
  it('should allow the matching bearer token and reject a wrong or missing one', () => {
    const guard = new ChecklistSyncTokenGuard({ tokenHash: hashOf(TOKEN) });

    expect(guard.canActivate(contextWith(`Bearer ${TOKEN}`))).toBe(true);
    expect(() => guard.canActivate(contextWith('Bearer someone-else'))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(contextWith())).toThrow(UnauthorizedException);
  });

  it('should reject every token when no hash is configured', () => {
    const guard = new ChecklistSyncTokenGuard({ tokenHash: null });

    expect(() => guard.canActivate(contextWith(`Bearer ${TOKEN}`))).toThrow(UnauthorizedException);
  });
});
