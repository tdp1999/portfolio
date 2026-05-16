import { DestroyRef, Signal, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of, startWith } from 'rxjs';

/**
 * Reactive state of a fetched value: `loading` (no payload yet OR re-fetching after a source
 * change), `ready` (last emission was a value), or `error` (last emission was a thrown error).
 *
 * Used by `asyncResource()` to expose post-hydration HTTP state to landing pages without the
 * "flash of empty list → real data" that happens when a raw `toSignal(initialValue: [])` is
 * indistinguishable from a successful empty response.
 */
export type AsyncStatus = 'loading' | 'ready' | 'error';

export interface AsyncResource<T> {
  /** Current lifecycle status. */
  readonly status: Signal<AsyncStatus>;
  /** Last successful payload, or `opts.initialValue` until the first `ready` emission. */
  readonly data: Signal<T>;
  /** Last error if status is `error`, else `null`. */
  readonly error: Signal<unknown>;
  /** `true` while status is `loading`. Flips immediately — use for logic, not for UI. */
  readonly isLoading: Signal<boolean>;
  /**
   * `true` only when loading has lasted longer than `delayMs`, and once true stays true for at
   * least `minMs`. Bind this in templates instead of `isLoading` to avoid spinner flash on fast
   * responses and spinner flicker on slow ones.
   */
  readonly showSpinner: Signal<boolean>;
  /** `true` when status is `ready` AND `opts.isEmpty(data)` returns true. */
  readonly isEmpty: Signal<boolean>;
}

export interface AsyncResourceOptions<T> {
  /** Returned by `data()` until the first successful emission. */
  readonly initialValue: T;
  /** Delay before `showSpinner` flips to true. Default 200ms. */
  readonly delayMs?: number;
  /** Minimum time `showSpinner` stays true once shown. Default 500ms. */
  readonly minMs?: number;
  /** Predicate to detect "loaded but no items" — drives `isEmpty`. Default: never empty. */
  readonly isEmpty?: (data: T) => boolean;
}

/**
 * Wrap an `Observable<T>` in a structured loading-state resource backed by signals.
 *
 * **Must be called in an injection context** (component/directive/service field initializer or
 * constructor, `runInInjectionContext`, route resolver factory). Internally calls
 * `inject(DestroyRef)` to dispose pending spinner timers — throws `NG0203` if invoked from
 * `ngOnInit`, an event handler, or any other non-injection context.
 *
 * **Why this exists.** Landing pages hit `/api/...` after hydration on client-side navigation
 * (e.g. home → /projects). The raw pattern `toSignal(source$, { initialValue: [] })` cannot
 * distinguish "still loading" from "loaded and empty" — the template renders the empty state
 * for a few frames, then snaps to the real list. `asyncResource()` returns a `showSpinner`
 * signal with deliberate timing (don't show under 200ms; once shown, stay at least 500ms)
 * that hides both flashes.
 *
 * **SSR-safe.** When the SSR HTTP request resolves (via transfer cache or pendingTasks), the
 * source emits synchronously inside the first change-detection tick, so `showSpinner` never
 * flips to true on the server. No platform check needed.
 *
 * **Re-fetch loading.** To get a `loading` frame on each re-fetch (e.g. switchMap'd by an
 * input signal), the caller should emit a loading marker themselves:
 *
 * ```ts
 * const source$ = toObservable(this.query).pipe(
 *   switchMap((q) => this.service.fetch(q))
 * );
 * ```
 *
 * The above only marks initial loading. With shareReplay caches this is usually enough — and
 * the projects archive's filter cascade is synchronous from cache, so we don't try to render
 * a spinner on every filter chip click.
 *
 * @param source$ - Cold or hot observable producing values of `T`. Errors are caught and
 *   surfaced through `status === 'error'` rather than crashing the signal pipeline.
 * @param opts - Initial value (required) plus optional timing + emptiness predicate.
 */
export function asyncResource<T>(source$: Observable<T>, opts: AsyncResourceOptions<T>): AsyncResource<T> {
  const delayMs = opts.delayMs ?? 200;
  const minMs = opts.minMs ?? 500;
  const isEmptyFn = opts.isEmpty;

  type Frame = { kind: 'loading' } | { kind: 'ready'; data: T } | { kind: 'error'; error: unknown };

  // `startWith` guarantees the source emits synchronously on subscribe, so `requireSync` is
  // safe and gives us `Signal<Frame>` (non-nullable) which the narrowing below depends on.
  //
  // NOTE: `catchError` here returns `of(...)` which COMPLETES the stream. Once the source
  // errors, the resource freezes on `error` permanently — re-emissions from upstream (e.g. a
  // future retry button wired into a Subject feeding `source$`) will not reach `toSignal`.
  // For retriable resources, the caller must reconstruct the asyncResource (or wrap their
  // own retry logic with `switchMap` upstream of this helper). Sufficient for landing's
  // fire-and-forget archive fetches; revisit if/when retry UI lands.
  const frame = toSignal(
    source$.pipe(
      map<T, Frame>((data) => ({ kind: 'ready', data })),
      catchError((error) => of<Frame>({ kind: 'error', error })),
      startWith<Frame>({ kind: 'loading' })
    ),
    { requireSync: true }
  );

  const status = computed<AsyncStatus>(() => frame().kind);
  const isLoading = computed(() => status() === 'loading');
  const data = computed<T>(() => {
    const f = frame();
    return f.kind === 'ready' ? f.data : opts.initialValue;
  });
  const error = computed<unknown>(() => {
    const f = frame();
    return f.kind === 'error' ? f.error : null;
  });
  const isEmpty = computed(() => status() === 'ready' && (isEmptyFn?.(data()) ?? false));

  // Spinner timing — flip-then-hold logic, driven by `isLoading` transitions.
  const showSpinner = signal(false);
  let showTimer: ReturnType<typeof setTimeout> | null = null;
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let shownAt = 0;

  const clearShow = () => {
    if (showTimer !== null) {
      clearTimeout(showTimer);
      showTimer = null;
    }
  };
  const clearHide = () => {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  };

  effect(() => {
    const loading = isLoading();
    untracked(() => {
      if (loading) {
        clearHide();
        if (showSpinner() || showTimer !== null) return;
        showTimer = setTimeout(() => {
          showTimer = null;
          shownAt = Date.now();
          showSpinner.set(true);
        }, delayMs);
        return;
      }

      clearShow();
      if (!showSpinner()) return;
      const remaining = Math.max(0, minMs - (Date.now() - shownAt));
      if (remaining === 0) {
        showSpinner.set(false);
        return;
      }
      hideTimer = setTimeout(() => {
        hideTimer = null;
        showSpinner.set(false);
      }, remaining);
    });
  });

  inject(DestroyRef).onDestroy(() => {
    clearShow();
    clearHide();
  });

  return { status, data, error, isLoading, showSpinner, isEmpty };
}
