/**
 * @jest-environment node
 */
import { isUnderPaths, proxyResponseHeaders } from './server.util';

describe('proxyResponseHeaders', () => {
  it('should keep every Set-Cookie line, so both auth cookies reach the browser', () => {
    const headers = new Headers({ 'content-type': 'application/json', connection: 'keep-alive' });
    headers.append('set-cookie', 'refresh_token=r; HttpOnly');
    headers.append('set-cookie', 'csrf_token=c');

    expect(proxyResponseHeaders(headers)).toEqual([
      ['content-type', 'application/json'],
      ['set-cookie', ['refresh_token=r; HttpOnly', 'csrf_token=c']],
    ]);
  });
});

describe('isUnderPaths', () => {
  it.each([
    ['/checklist', true],
    ['/checklist/abc', true],
    ['/checklists', false],
    ['/', false],
  ])('should match %s: %s', (path, expected) => {
    expect(isUnderPaths(path, ['checklist', 'sign-in'])).toBe(expected);
  });
});
