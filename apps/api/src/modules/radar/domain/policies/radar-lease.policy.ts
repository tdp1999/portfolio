import { RADAR_MAX_CLAIM_ATTEMPTS } from '@portfolio/shared/types';

/**
 * How long the worker holds a claimed item and how often an item may be claimed (RAD-005). The
 * claim itself is one SQL statement (`FOR UPDATE SKIP LOCKED`) in the repository, so two workers
 * never get the same item; this class only names the numbers it runs with.
 */
export class RadarLeasePolicy {
  // --- Constants ---

  /** Long enough for one analyze pass over a batch, short enough that a crashed worker's items return soon. */
  static readonly LEASE_MS = 30 * 60 * 1000;
  /** Past this many claims with no result, an item is stuck: the Feed shows it, claim skips it. */
  static readonly MAX_CLAIM_ATTEMPTS = RADAR_MAX_CLAIM_ATTEMPTS;

  // --- Rules ---

  static expiresAt(now: Date): Date {
    return new Date(now.getTime() + RadarLeasePolicy.LEASE_MS);
  }
}
