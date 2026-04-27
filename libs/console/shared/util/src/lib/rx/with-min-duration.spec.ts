import { TestScheduler } from 'rxjs/testing';
import { withMinDuration } from './with-min-duration';

describe('withMinDuration', () => {
  let scheduler: TestScheduler;

  beforeEach(() => {
    scheduler = new TestScheduler((actual, expected) => expect(actual).toEqual(expected));
  });

  it('delays a fast source until the minimum has elapsed', () => {
    scheduler.run(({ cold, expectObservable }) => {
      // Source emits at frame 1 and completes; min duration is 5 frames
      const source = cold('-a|', { a: 'value' });
      const expected = '   -----(a|)';
      expectObservable(source.pipe(withMinDuration(5))).toBe(expected, { a: 'value' });
    });
  });

  it('passes through a slow source unchanged', () => {
    scheduler.run(({ cold, expectObservable }) => {
      // Source emits at frame 10; min duration is 3 frames — no extra delay
      const source = cold('----------(a|)', { a: 'value' });
      const expected = '   ----------(a|)';
      expectObservable(source.pipe(withMinDuration(3))).toBe(expected, { a: 'value' });
    });
  });

  it('propagates errors immediately without honoring the floor', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source = cold('-#', undefined, new Error('boom'));
      const expected = '   -#';
      expectObservable(source.pipe(withMinDuration(10))).toBe(expected, undefined, new Error('boom'));
    });
  });

  it('passes emissions arriving after the timer through unchanged', () => {
    scheduler.run(({ cold, expectObservable }) => {
      // Source: a@1, b@5, c@7, complete@8. Timer(3) emits at frame 3.
      // a is held (timer not ready); at frame 3 combineLatest has both — emits a.
      // b at frame 5 flows through; c at frame 7 flows through.
      const source = cold('-a---b-c|', { a: 1, b: 2, c: 3 });
      const expected = '   ---a-b-c|';
      expectObservable(source.pipe(withMinDuration(3))).toBe(expected, { a: 1, b: 2, c: 3 });
    });
  });
});
