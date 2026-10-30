import { safeReturnTo } from './return-to.util';

// R16.6 of the medicine cabinet epic: the console only goes back to a URL on the landing origin.
const LANDING = 'https://landing.test';

describe('safeReturnTo', () => {
  it('R16.6: keeps a landing URL with its query, so S6 opens with the same keyword and chip', () => {
    const url = 'https://landing.test/medicine-cabinet?q=simethicone&person=01a10b5b-9d90-753e-a6a3-0000000000a1';
    expect(safeReturnTo(url, LANDING)).toBe(url);
  });

  it.each([
    ['another origin', 'https://evil.example'],
    ['a protocol-relative URL', '//evil.example'],
    ['a javascript: URL', 'javascript:alert(1)'],
    ['an origin that only starts like the landing host', 'https://landing.test.evil.example/medicine-cabinet'],
    ['a URL that hides another host behind the landing host as userinfo', 'https://landing.test@evil.example/'],
    ['the landing host over plain http', 'http://landing.test/medicine-cabinet'],
    ['an empty value', ''],
    ['a missing value', null],
  ])('R16.6: rejects %s', (_label, raw) => {
    expect(safeReturnTo(raw, LANDING)).toBeNull();
  });
});
