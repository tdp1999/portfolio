import { signInReturnUrl } from './sign-in.util';

describe('signInReturnUrl', () => {
  it.each([
    ['/about#experience', '/about#experience'],
    ['/checklist', '/checklist'],
    [undefined, '/'],
    ['/sign-in', '/'],
    ['/sign-in?x=1', '/'],
  ])('should return from the previous page %p to %s', (previous, expected) => {
    expect(signInReturnUrl(null, previous)).toBe(expected);
  });

  it('should prefer the next param over the previous page', () => {
    expect(signInReturnUrl('/checklist/abc', '/about')).toBe('/checklist/abc');
  });

  it.each(['//evil.example', 'https://evil.example', '/sign-in', ''])(
    'should ignore an unsafe or useless next %p',
    (next) => {
      expect(signInReturnUrl(next, '/about')).toBe('/about');
    }
  );
});
