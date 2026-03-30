import { isDisposableEmail } from './disposable-email';

describe('isDisposableEmail', () => {
  it('should return true for known disposable domains', () => {
    expect(isDisposableEmail('user@mailinator.com')).toBe(true);
    expect(isDisposableEmail('test@guerrillamail.com')).toBe(true);
    expect(isDisposableEmail('spam@yopmail.com')).toBe(true);
    expect(isDisposableEmail('temp@tempmail.com')).toBe(true);
    expect(isDisposableEmail('fake@10minutemail.com')).toBe(true);
  });

  it('should return false for normal domains', () => {
    expect(isDisposableEmail('user@gmail.com')).toBe(false);
    expect(isDisposableEmail('user@yahoo.com')).toBe(false);
    expect(isDisposableEmail('user@outlook.com')).toBe(false);
    expect(isDisposableEmail('user@company.com')).toBe(false);
    expect(isDisposableEmail('user@protonmail.com')).toBe(false);
  });

  it('should be case-insensitive for domain check', () => {
    expect(isDisposableEmail('user@MAILINATOR.COM')).toBe(true);
    expect(isDisposableEmail('user@Yopmail.Com')).toBe(true);
  });

  it('should return false for malformed email', () => {
    expect(isDisposableEmail('not-an-email')).toBe(false);
    expect(isDisposableEmail('')).toBe(false);
  });
});
