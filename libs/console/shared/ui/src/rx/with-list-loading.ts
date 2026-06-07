import { WritableSignal } from '@angular/core';
import { defer, finalize, MonoTypeOperatorFunction, Observable } from 'rxjs';
import { SKELETON_MIN_DURATION_MS, withMinDuration } from '@portfolio/console/shared/util';
import { ProgressBarService } from '../loading-bar/progress-bar.service';

export interface ListLoadingOptions {
  /** When true, no skeleton — top progress bar shows for background refresh. */
  silent?: boolean;
  /** Page-level loading flag toggled while skeleton is visible. */
  loading: WritableSignal<boolean>;
  /** Service driving the top progress bar (used in silent mode). */
  progress: ProgressBarService;
  /** Override the skeleton minimum visible duration. */
  minDuration?: number;
}

/**
 * Wraps a list-fetch observable with the console's standard loading behavior:
 *
 * - **silent=false (default):** flips `loading` true on subscribe, applies
 *   `withMinDuration` to prevent skeleton flicker, and flips `loading` false
 *   after the source completes/errors.
 * - **silent=true:** no skeleton; instead claims a `ProgressBarService` handle
 *   so the top bar shows until the source settles. Used for background refresh
 *   after mutations (save / delete / restore).
 *
 * `defer` ensures side-effects (signal flip, progress handle) run on subscribe,
 * not on operator application. `finalize` replaces ad-hoc setTimeout cleanup.
 */
export function withListLoading<T>(opts: ListLoadingOptions): MonoTypeOperatorFunction<T> {
  return (source) =>
    defer<Observable<T>>(() => {
      if (opts.silent) {
        const handle = opts.progress.start();
        return source.pipe(finalize(() => handle.complete()));
      }
      opts.loading.set(true);
      return source.pipe(
        withMinDuration(opts.minDuration ?? SKELETON_MIN_DURATION_MS),
        finalize(() => opts.loading.set(false))
      );
    });
}
