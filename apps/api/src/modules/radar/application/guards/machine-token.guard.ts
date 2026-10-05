import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

import { RADAR_WORKER_CONFIG, RadarWorkerConfig } from '../radar-worker.config';

/**
 * Lets the external worker (Claude Code on the Owner's machine) call the Radar worker routes.
 * Applied to the worker controller only; the token is not a JWT, so `JwtAccessGuard` rejects it
 * everywhere else (RAD-004).
 */
@Injectable()
export class MachineTokenGuard implements CanActivate {
  constructor(@Inject(RADAR_WORKER_CONFIG) private readonly config: RadarWorkerConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const header: unknown = context.switchToHttp().getRequest().headers['authorization'];
    const { tokenHash } = this.config;

    if (!tokenHash) throw new UnauthorizedException('Radar worker access is not configured');
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    // Both sides are 32-byte digests, so the comparison length never depends on the input.
    const presented = createHash('sha256').update(header.slice(7)).digest();
    if (!timingSafeEqual(presented, tokenHash)) throw new UnauthorizedException('Invalid machine token');
    return true;
  }
}
