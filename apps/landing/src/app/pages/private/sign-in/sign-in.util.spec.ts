import { signInReturnUrl } from './sign-in.util';

describe('signInReturnUrl', () => {
  it.each([
    ['/about#experience', '/about#experience'],
    ['/checklist', '/checklist'],
    [undefined, '/'],
    ['/sign-in', '/'],
    ['/sign-in?x=1', '/'],
  ])('should return from %p to %s', (previous, expected) => {
    expect(signInReturnUrl(previous)).toBe(expected);
  });
});
