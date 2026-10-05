import { SetHasPipe } from './set-has.pipe';

describe('SetHasPipe', () => {
  const pipe = new SetHasPipe();

  it('returns true for a member', () => {
    expect(pipe.transform(new Set(['a', 'b']), 'a')).toBe(true);
  });

  it('returns false for a non-member', () => {
    expect(pipe.transform(new Set(['a']), 'z')).toBe(false);
  });
});
