import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { UserRole } from '../../../user/domain/user.types';

export const Roles = Reflector.createDecorator<UserRole[]>();

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Handler *and* class. `reflector.get(Roles, getHandler())` sees method-level metadata only,
    // so a controller decorated at class level — `DashboardController`, `BlogPostAdminController` —
    // resolved to `undefined` roles and fell through the "nothing declared, allow" branch below.
    // The declaration read exactly like the enforced ones while enforcing nothing, which left the
    // whole `admin/blog` API and dashboard stats open to any authenticated non-admin user.
    // Handler wins over class, which is what `getAllAndOverride` means by override.
    const roles = this.reflector.getAllAndOverride<UserRole[]>(Roles, [context.getHandler(), context.getClass()]);
    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return roles.includes(user?.role);
  }
}
