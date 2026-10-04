import { finiteNumber, isPlainObject, nonEmptyString, stringArray } from './guards.util';

describe('guards.util', () => {
  it('isPlainObject should accept objects and reject null, arrays and primitives', () => {
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect([null, [], 'x', 1, undefined].map(isPlainObject)).toEqual([false, false, false, false, false]);
  });

  it('nonEmptyString should return null for the empty string and non-strings', () => {
    expect(nonEmptyString(' a ')).toBe(' a ');
    expect(['', 1, null, {}].map(nonEmptyString)).toEqual([null, null, null, null]);
  });

  it('finiteNumber should reject NaN, Infinity and numeric strings', () => {
    expect(finiteNumber(0)).toBe(0);
    expect([NaN, Infinity, '1', null].map(finiteNumber)).toEqual([null, null, null, null]);
  });

  it('stringArray should keep only string entries and treat non-arrays as empty', () => {
    expect(stringArray(['a', 1, null, 'b'])).toEqual(['a', 'b']);
    expect(stringArray({ 0: 'a' })).toEqual([]);
  });
});
