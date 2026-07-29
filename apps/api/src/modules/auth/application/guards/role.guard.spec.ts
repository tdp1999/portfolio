import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../user/domain/user.types';
import { RoleGuard, Roles } from './role.guard';

/**
 * The class-level cases are the point of this file.
 *
 * `@Roles(['ADMIN'])` reads identically whether it decorates a method or a controller class, but
 * only one of the two was ever enforced: the guard resolved metadata from `context.getHandler()`
 * alone, so a class-level decorator produced `undefined` roles and the guard's "nothing declared,
 * allow" branch opened the route to every authenticated user. `DashboardController` and
 * `BlogPostAdminController` both declare at class level, which left the whole `admin/blog` API and
 * the dashboard stats readable and writable by a non-admin — verified live before this fix
 * (`GET /api/admin/blog` → 200 with a `USER` token, while method-decorated `GET /api/users` → 403).
 */
describe('RoleGuard', () => {
  /**
   * Mirrors how Nest resolves decorators: a handler and its declaring class, either of which may
   * carry the metadata. `Reflector` reads it off the real function/class objects, so the decorator
   * is applied to them here rather than being stubbed.
   */
  function createContext(opts: { role?: string; onHandler?: UserRole[]; onClass?: UserRole[] }): ExecutionContext {
    const handler = function handlerFn() {
      /* route handler */
    };
    class TestController {}

    if (opts.onHandler) Roles(opts.onHandler)({ constructor: TestController }, 'handlerFn', { value: handler });
    if (opts.onClass) Roles(opts.onClass)(TestController);

    return {
      getHandler: () => handler,
      getClass: () => TestController,
      switchToHttp: () => ({ getRequest: () => (opts.role ? { user: { role: opts.role } } : {}) }),
    } as unknown as ExecutionContext;
  }

  let guard: RoleGuard;

  beforeEach(() => {
    guard = new RoleGuard(new Reflector());
  });

  describe('no roles declared', () => {
    it('allows the request', () => {
      expect(guard.canActivate(createContext({ role: 'USER' }))).toBe(true);
    });
  });

  describe('declared on the handler', () => {
    it('allows a matching role', () => {
      expect(guard.canActivate(createContext({ role: 'ADMIN', onHandler: ['ADMIN'] }))).toBe(true);
    });

    it('denies a non-matching role', () => {
      expect(guard.canActivate(createContext({ role: 'USER', onHandler: ['ADMIN'] }))).toBe(false);
    });
  });

  describe('declared on the controller class', () => {
    it('allows a matching role', () => {
      expect(guard.canActivate(createContext({ role: 'ADMIN', onClass: ['ADMIN'] }))).toBe(true);
    });

    it('denies a non-matching role', () => {
      expect(guard.canActivate(createContext({ role: 'USER', onClass: ['ADMIN'] }))).toBe(false);
    });

    it('denies an unauthenticated request', () => {
      expect(guard.canActivate(createContext({ onClass: ['ADMIN'] }))).toBe(false);
    });
  });

  /**
   * The two levels must declare **different** roles, otherwise the assertion passes under either
   * precedence and pins nothing. `getAllAndOverride` returns the first non-undefined entry in the
   * array it is given, so the handler's `['USER']` must shadow the class's `['ADMIN']` entirely
   * rather than being merged with it — a union would deny this request.
   */
  describe('declared on both', () => {
    it('lets the handler override the class', () => {
      expect(guard.canActivate(createContext({ role: 'USER', onHandler: ['USER'], onClass: ['ADMIN'] }))).toBe(true);
    });

    it('denies a role the handler does not name, even when the class would allow it', () => {
      expect(guard.canActivate(createContext({ role: 'ADMIN', onHandler: ['USER'], onClass: ['ADMIN'] }))).toBe(false);
    });
  });
});
