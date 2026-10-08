import { RadarNormalizeFailure } from '../radar.types';
import { RadarRunFailure, RadarRunFailureLogProps, RadarStepMeta } from '../radar-run.types';

/**
 * The posts of a run NORMALIZE could not read. The first {@link MAX_KEPT} are kept with their
 * reason so the run detail page can list them; the rest are only counted.
 */
export class RadarRunFailureLog {
  // --- Constants ---

  static readonly MAX_KEPT = 20;
  static readonly MAX_REASON = 300;

  private constructor(
    readonly failures: readonly RadarRunFailure[],
    readonly dropped: number
  ) {
    Object.freeze(this);
  }

  // --- Factory Methods ---

  static fromMeta(meta: RadarStepMeta): RadarRunFailureLog {
    return new RadarRunFailureLog(meta.failures ?? [], Number(meta.failuresDropped ?? 0));
  }

  // --- Rules ---

  add(failures: readonly RadarNormalizeFailure[]): RadarRunFailureLog {
    const room = Math.max(0, RadarRunFailureLog.MAX_KEPT - this.failures.length);
    const kept = failures.slice(0, room).map((f) => ({
      ref: f.ref ?? null,
      reason: f.reason.slice(0, RadarRunFailureLog.MAX_REASON),
    }));
    return new RadarRunFailureLog([...this.failures, ...kept], this.dropped + failures.length - kept.length);
  }

  toMeta(): RadarRunFailureLogProps {
    return { failures: [...this.failures], failuresDropped: this.dropped };
  }
}
