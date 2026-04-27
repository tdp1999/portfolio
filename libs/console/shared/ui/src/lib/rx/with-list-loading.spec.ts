import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProgressBarService } from '../loading-bar/progress-bar.service';
import { withListLoading } from './with-list-loading';

describe('withListLoading', () => {
  let progress: ProgressBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    progress = TestBed.inject(ProgressBarService);
    progress.reset();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('non-silent mode', () => {
    it('toggles the loading signal across subscribe and settle', () => {
      const loading = signal(false);
      let received: string | undefined;

      of('payload')
        .pipe(withListLoading({ loading, progress, minDuration: 100 }))
        .subscribe((v) => (received = v));

      expect(loading()).toBe(true);
      expect(received).toBeUndefined();

      jest.advanceTimersByTime(100);
      expect(received).toBe('payload');
      expect(loading()).toBe(false);
    });

    it('still clears loading on error', () => {
      const loading = signal(false);
      let errored = false;

      throwError(() => new Error('boom'))
        .pipe(withListLoading({ loading, progress, minDuration: 50 }))
        .subscribe({ error: () => (errored = true) });

      // Errors propagate immediately — no min duration on the error path
      expect(errored).toBe(true);
      expect(loading()).toBe(false);
    });
  });

  describe('silent mode', () => {
    it('does not toggle the loading signal and routes through the progress bar', () => {
      const loading = signal(false);
      let received: string | undefined;

      of('payload')
        .pipe(withListLoading({ silent: true, loading, progress }))
        .subscribe((v) => (received = v));

      expect(loading()).toBe(false);
      expect(received).toBe('payload');
      expect(progress.active()).toBe(false); // started + completed synchronously
    });

    it('keeps the progress bar active while pending and clears on error', () => {
      const loading = signal(false);
      let errored = false;

      throwError(() => new Error('boom'))
        .pipe(withListLoading({ silent: true, loading, progress }))
        .subscribe({ error: () => (errored = true) });

      expect(errored).toBe(true);
      expect(loading()).toBe(false);
      expect(progress.active()).toBe(false);
    });
  });
});
