import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

import { CHECKLIST_SYNC_CONFIG, ChecklistSyncConfig } from '../checklist-sync.config';

/**
 * Lets `pnpm checklist:push` on the Owner's machine call the docs sync route, and nothing else
 * (CHK-004). The token is not a JWT, so `JwtAccessGuard` rejects it on every other route.
 */
@Injectable()
export class ChecklistSyncTokenGuard implements CanActivate {
  constructor(@Inject(CHECKLIST_SYNC_CONFIG) private readonly config: ChecklistSyncConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const header: unknown = context.switchToHttp().getRequest().headers['authorization'];
    const { tokenHash } = this.config;

    if (!tokenHash) throw new UnauthorizedException('Checklist sync is not configured');
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    // Both sides are 32-byte digests, so the comparison length never depends on the input.
    const presented = createHash('sha256').update(header.slice(7)).digest();
    if (!timingSafeEqual(presented, tokenHash)) throw new UnauthorizedException('Invalid sync token');
    return true;
  }
}
