import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { CsrfGuard } from './csrf.guard';

describe('CsrfGuard', () => {
  let guard: CsrfGuard;

  function createMockContext(
    cookies: Record<string, string>,
    headers: Record<string, string>
  ): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ cookies, headers }),
      }),
    } as ExecutionContext;
  }

  beforeEach(() => {
    guard = new CsrfGuard();
  });

  it('should allow request when CSRF header matches cookie', () => {
    const token = 'valid-csrf-token';
    const context = createMockContext({ csrf_token: token }, { 'x-csrf-token': token });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should reject request when CSRF header is missing', () => {
    const context = createMockContext({ csrf_token: 'some-token' }, {});

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Missing CSRF token header');
  });

  it('should reject request when CSRF cookie is missing', () => {
    const context = createMockContext({}, { 'x-csrf-token': 'some-token' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('Missing CSRF token cookie');
  });

  it('should reject request when CSRF header does not match cookie', () => {
    const context = createMockContext(
      { csrf_token: 'cookie-value' },
      { 'x-csrf-token': 'different-header-value' }
    );

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow('CSRF token mismatch');
  });

  it('should reject when cookie is empty string', () => {
    const context = createMockContext({ csrf_token: '' }, { 'x-csrf-token': '' });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
