import { DestroyRef, effect, inject, isDevMode, PLATFORM_ID, signal, type Signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

const SIXTY_SECONDS = 60_000;

/**
 * Returns a signal that emits an `HH:mm` string in the given IANA timezone.
 *
 * The timezone is taken as a `Signal<string>` so the formatter reacts when the
 * source changes — typically when the profile resolves asynchronously after
 * SSR. The displayed minute updates on a one-minute interval and pauses while
 * the tab is hidden via the page-visibility API.
 */
export function liveClock(timezone: Signal<string>): Signal<string> {
  const platformId = inject(PLATFORM_ID);
  const document = inject(DOCUMENT);
  const destroyRef = inject(DestroyRef);

  const compute = () => safeFormatter(timezone()).format(new Date());
  const value = signal(compute());

  // Re-format when the timezone signal changes (e.g., profile load completes
  // after the initial signal init read the empty fallback).
  effect(() => {
    const tz = timezone();
    value.set(safeFormatter(tz).format(new Date()));
  });

  if (!isPlatformBrowser(platformId)) {
    return value;
  }

  let intervalId: ReturnType<typeof setInterval> | null = null;

  const start = () => {
    if (intervalId !== null) return;
    value.set(compute());
    intervalId = setInterval(() => value.set(compute()), SIXTY_SECONDS);
  };
  const stop = () => {
    if (intervalId === null) return;
    clearInterval(intervalId);
    intervalId = null;
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') start();
    else stop();
  };

  start();
  document.addEventListener('visibilitychange', onVisibilityChange);

  destroyRef.onDestroy(() => {
    stop();
    document.removeEventListener('visibilitychange', onVisibilityChange);
  });

  return value;
}

function safeFormatter(timezone: string): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });
  } catch (err) {
    if (isDevMode()) {
      // eslint-disable-next-line no-console
      console.warn(`[liveClock] Invalid timezone "${timezone}", falling back to local`, err);
    }
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }
}
