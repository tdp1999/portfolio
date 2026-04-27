import { combineLatest, MonoTypeOperatorFunction, timer } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Floors the time before the source's first emission to at least `minMs`.
 * Faster sources are held until the timer elapses; slower sources pass through
 * unchanged. Errors propagate immediately — they are not delayed.
 *
 * Useful for skeleton-loader anti-flicker: prevents sub-perception flashes
 * when a network request resolves faster than the eye can track.
 *
 * Implementation: races the source against `timer(minMs)` via `combineLatest`,
 * which emits only after both have produced a value. The timer completes after
 * one tick, so subsequent source emissions pass through with no delay.
 */
export function withMinDuration<T>(minMs: number): MonoTypeOperatorFunction<T> {
  return (source) => combineLatest([source, timer(minMs)]).pipe(map(([value]) => value));
}
